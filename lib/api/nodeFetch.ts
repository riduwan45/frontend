import type { IncomingMessage } from 'http';
import type { NextApiRequest } from 'next';
import type { NextApiRequestCookies } from 'next/dist/server/api-utils';
import type { RequestInit, Response } from 'node-fetch';
import nodeFetch from 'node-fetch';

import { httpLogger } from 'lib/api/logger';
import * as cookies from 'lib/cookies';

export default function fetchFactory(
  _req: NextApiRequest | (IncomingMessage & { cookies: NextApiRequestCookies }),
) {
  // first arg can be only a string
  // FIXME migrate to RequestInfo later if needed
  return function fetch(url: string, init?: RequestInit): Promise<Response> {
    const incomingContentType = _req.headers['content-type'];
    const headers = {
      accept: 'application/json',
      'content-type': incomingContentType?.match(/^multipart\/form-data/) ? incomingContentType : 'application/json',
      cookie: `${ cookies.NAMES.API_TOKEN }=${ _req.cookies[cookies.NAMES.API_TOKEN] }`,
    };

    httpLogger.logger.info({
      message: 'Trying to call API',
      url,
      req: _req,
    });

    const body = (() => {
      const _body = init?.body;
      if (!_body) {
        return;
      }

      if (typeof _body === 'string') {
        return _body;
      }

      return JSON.stringify(_body);
    })();

    return nodeFetch(url, {
      ...init,
      headers,
      body,
    });
  };
}
