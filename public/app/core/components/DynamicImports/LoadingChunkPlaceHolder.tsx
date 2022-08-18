import React, { FunctionComponent } from 'react';

// import { LoadingPlaceholder } from '@grafana/ui';

export const LoadingChunkPlaceHolder: FunctionComponent = React.memo(() => (
  <div className="preloader">
    {/* TBD: Navpreet chnage loading <LoadingPlaceholder text={'Loading...'} /> */}
    Loading...
  </div>
));

LoadingChunkPlaceHolder.displayName = 'LoadingChunkPlaceHolder';
