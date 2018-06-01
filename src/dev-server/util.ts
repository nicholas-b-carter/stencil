import * as d from '../declarations';


export function getClientSideConfig(devServerConfig: d.DevServerConfig) {
  const browserUrl = getBrowserUrl(devServerConfig);
  const openUrl = browserUrl + UNREGISTER_SW_URL;

  const clientConfig: d.DevServerClientConfig = {
    ssl: devServerConfig.ssl,
    address: devServerConfig.address,
    port: devServerConfig.port,
    browserUrl: browserUrl,
    openUrl: openUrl,
    liveReload: devServerConfig.liveReload
  };

  return clientConfig;
}

export function getBrowserUrl(devServerConfig: d.DevServerConfig) {
  const address = (devServerConfig.address === '0.0.0.0') ? 'localhost' : devServerConfig.address;
  const port = (devServerConfig.port === 80 || devServerConfig.port === 443) ? '' : (':' + devServerConfig.port);
  return `${devServerConfig.ssl ? 'https' : 'http'}://${address}${port}`;
}

export function getContentType(devServerConfig: d.DevServerConfig, filePath: string) {
  const last = filePath.replace(/^.*[/\\]/, '').toLowerCase();
  const ext = last.replace(/^.*\./, '').toLowerCase();

  const hasPath = last.length < filePath.length;
  const hasDot = ext.length < last.length - 1;

  return ((hasDot || !hasPath) && devServerConfig.contentTypes[ext]) || 'application/octet-stream';
}

export function isHtmlFile(filePath: string) {
  filePath = filePath.toLowerCase().trim();
  return (filePath.endsWith('.html') || filePath.endsWith('.htm'));
}

export function isStaticDevClient(req: d.HttpRequest) {
  return req.pathname.startsWith(DEV_SERVER_URL);
}

export function isInitialDevServerLoad(pathname: string) {
  return pathname === UNREGISTER_SW_URL;
}

export const DEV_SERVER_URL = '/__dev-server';

export const UNREGISTER_SW_URL = `${DEV_SERVER_URL}-init`;
