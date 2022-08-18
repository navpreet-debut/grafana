package kvstore

import (
	"context"
	"fmt"

	"github.com/grafana/grafana/pkg/infra/kvstore"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/secrets"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
)

// PluginSecretMigrationService This migrator will handle migration of datasource secrets (aka Unified secrets)
// into the plugin secrets configured
type PluginSecretMigrationService struct {
	secretsStore   SecretsKVStore
	cfg            *setting.Cfg
	logger         log.Logger
	sqlStore       sqlstore.Store
	secretsService secrets.Service
	kvstore        kvstore.KVStore
	manager        plugins.SecretsPluginManager
	getAllFunc     func(ctx context.Context) ([]Item, error)
}

func ProvidePluginSecretMigrationService(
	secretsStore SecretsKVStore,
	cfg *setting.Cfg,
	sqlStore sqlstore.Store,
	secretsService secrets.Service,
	kvstore kvstore.KVStore,
	manager plugins.SecretsPluginManager,
) *PluginSecretMigrationService {
	return &PluginSecretMigrationService{
		secretsStore:   secretsStore,
		cfg:            cfg,
		logger:         log.New("sec-plugin-mig"),
		sqlStore:       sqlStore,
		secretsService: secretsService,
		kvstore:        kvstore,
		manager:        manager,
	}
}

func (s *PluginSecretMigrationService) Migrate(ctx context.Context) error {
	// Check if we should migrate to plugin - default false
	if err := EvaluateRemoteSecretsPlugin(s.manager, s.cfg); err == nil {
		s.logger.Debug("starting migration of unified secrets to the plugin")
		// we need to instantiate the secretsKVStore as this is not on wire, and in this scenario,
		// the secrets store would be the plugin.
		secretsSql := &secretsKVStoreSQL{
			sqlStore:       s.sqlStore,
			secretsService: s.secretsService,
			log:            s.logger,
			decryptionCache: decryptionCache{
				cache: make(map[int64]cachedDecrypted),
			},
			GetAllFuncOverride: s.getAllFunc,
		}

		// before we start migrating, check see if plugin startup failures were already fatal
		namespacedKVStore := GetNamespacedKVStore(s.kvstore)
		wasFatal, err := isPluginStartupErrorFatal(ctx, namespacedKVStore)
		if err != nil {
			s.logger.Warn("unable to determine whether plugin startup failures are fatal - continuing migration anyway.")
		}

		allSec, err := secretsSql.GetAll(ctx)
		if err != nil {
			return nil
		}
		totalSec := len(allSec)
		// We just set it again as the current secret store should be the plugin secret
		s.logger.Debug(fmt.Sprintf("Total amount of secrets to migrate: %d", totalSec))
		for i, sec := range allSec {
			s.logger.Debug(fmt.Sprintf("Migrating secret %d of %d", i+1, totalSec), "current", i+1, "secretCount", totalSec)
			err = s.secretsStore.Set(ctx, *sec.OrgId, *sec.Namespace, *sec.Type, sec.Value)
			if err != nil {
				return err
			}
		}
		s.logger.Debug("migrated unified secrets to plugin", "number of secrets", totalSec)
		// as no err was returned, when we delete all the secrets from the sql store
		for index, sec := range allSec {
			s.logger.Debug(fmt.Sprintf("Cleaning secret %d of %d", index+1, totalSec), "current", index+1, "secretCount", totalSec)

			err = secretsSql.Del(ctx, *sec.OrgId, *sec.Namespace, *sec.Type)
			if err != nil {
				s.logger.Error("plugin migrator encountered error while deleting unified secrets")
				if index == 0 && !wasFatal {
					// old unified secrets still exists, so plugin startup errors are still not fatal, unless they were before we started
					err := setPluginStartupErrorFatal(ctx, namespacedKVStore, false)
					if err != nil {
						s.logger.Error("error reverting plugin failure fatal status", "error", err.Error())
					} else {
						s.logger.Debug("application will continue to function without the secrets plugin")
					}
				}
				return err
			}
		}
		s.logger.Debug("deleted unified secrets after migration", "number of secrets", totalSec)
	}
	return nil
}

// This is here to support testing and should normally not be called
// An edge case we are unit testing requires the GetAll function to return a value, but the Del function to return an error.
// This is not possible with the code as written, so this override function is a workaround. Should be refactored.
func (s *PluginSecretMigrationService) overrideGetAllFunc(getAllFunc func(ctx context.Context) ([]Item, error)) {
	s.getAllFunc = getAllFunc
}
