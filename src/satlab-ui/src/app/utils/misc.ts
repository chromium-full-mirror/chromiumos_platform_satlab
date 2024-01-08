import {environment} from '../../environments/environment';

export function getRPCHost() {
  const url = new URL(window.location.href);
  const hostname = environment.defaultHostName || url.hostname;
  const port = environment.defaultApiPort || url.port;
  let serviceUrl = String(url.protocol);
  serviceUrl = serviceUrl.concat('//', hostname, ':', port, '/rpc');
  // return serviceUrl.toString();
  return 'http://10.240.107.156/rpc';
}
