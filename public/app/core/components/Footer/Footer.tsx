import React, { FC } from 'react';

import { config } from '@grafana/runtime';
import { Icon, IconName } from '@grafana/ui';

export interface FooterLink {
  text: string;
  id?: string;
  icon?: IconName;
  url?: string;
  target?: string;
}

export let getFooterLinks = (): FooterLink[] => {
  return [
    {
      text: 'About Us',
      // icon: 'document-info',
      url: 'https://www.seachange.com/',
      target: '_blank',
    },
    {
      text: 'Support',
      icon: 'question-circle',
      url: 'https://www.seachange.com/contact',
      target: '_blank',
    },
    // ,
    // {
    //   text: 'Community',
    //   icon: 'comments-alt',
    //   url: 'https://community.grafana.com/?utm_source=grafana_footer',
    //   target: '_blank',
    // },
  ];
};

export let getVersionLinks = (): FooterLink[] => {
  // const { buildInfo, licenseInfo } = config;
  const { buildInfo } = config;
  const links: FooterLink[] = [];
  // const stateInfo = licenseInfo.stateInfo ? ` (${licenseInfo.stateInfo})` : '';

  // links.push({ text: `${buildInfo.edition}${stateInfo}`, url: licenseInfo.licenseUrl });

  if (buildInfo.hideVersion) {
    return links;
  }

  // links.push({ text: `v${buildInfo.version} (${buildInfo.commit})` });

  if (buildInfo.hasUpdate) {
    // links.push({
    //   id: 'updateVersion',
    //   text: `New version available!`,
    //   icon: 'download-alt',
    //   url: 'https://grafana.com/grafana/download?utm_source=grafana_footer',
    //   target: '_blank',
    // });
  }

  return links;
};

export function setFooterLinksFn(fn: typeof getFooterLinks) {
  getFooterLinks = fn;
}

export function setVersionLinkFn(fn: typeof getFooterLinks) {
  getVersionLinks = fn;
}

export const Footer: FC = React.memo(() => {
  const links = getFooterLinks().concat(getVersionLinks());

  return (
    <footer className="footer">
      <div className="text-center">
        <ul>
          {links.map((link) => (
            <li key={link.text}>
              <a href={link.url} target={link.target} rel="noopener" id={link.id}>
                {link.icon && <Icon name={link.icon} />} {link.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
