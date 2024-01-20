'use client';

import {useContext} from 'react';
import {CodeContext} from './codeContext';
import {ExternalLink} from './externalLink';
import {Note} from './note';
import {SignedInCheck} from './signedInCheck';
import {Alert} from './alert';
import {usePathname} from 'next/navigation';

export function OrgAuthTokenNote() {
  const pathname = usePathname();
  const url = 'https://docs.sentry.io' + pathname;

  const orgAuthTokenUrl = useOrgAuthTokenUrl();

  return (
    <>
      <SignedInCheck isUserAuthenticated={false}>
        <Note>
          You can{' '}
          <ExternalLink href={orgAuthTokenUrl} target="_blank">
            manually create an Auth Token
          </ExternalLink>{' '}
          or{' '}
          <ExternalLink href={`https://sentry.io/auth/login/?next=${url}`}>
            sign in
          </ExternalLink>{' '}
          to create a token directly from this page.
        </Note>
      </SignedInCheck>

      <SignedInCheck isUserAuthenticated>
        <Alert level="warning">
          You can{' '}
          <ExternalLink href={orgAuthTokenUrl} target="_blank">
            manually create an Auth Token
          </ExternalLink>{' '}
          or create a token directly from this page. A created token will only be visible
          once right after creation - make sure to copy it!
        </Alert>
      </SignedInCheck>
    </>
  );
}

export function useOrgAuthTokenUrl() {
  const context = useContext(CodeContext);

  // When not signed in, we use a redirect URL that uses the last org the user visited
  if (context === null || !context.codeKeywords.USER) {
    return 'https://sentry.io/orgredirect/organizations/:orgslug/settings/auth-tokens/';
  }

  const [sharedSelection] = context.sharedKeywordSelection;

  const choices = context.codeKeywords?.PROJECT;
  const currentSelectionIdx = sharedSelection.PROJECT ?? 0;
  const currentSelection = choices[currentSelectionIdx];

  const org = currentSelection.ORG_SLUG;

  return `https://sentry.io/settings/${org}/auth-tokens/`;
}
