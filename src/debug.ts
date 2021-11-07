import { devices, chromium } from 'playwright'
import { BrowserManager } from '.'

const debug = async () => {
  try {
    const proxies = [
      { url: 'http://45.89.19.21:16739@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.117:17807@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.50:7167@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.18.237:8135@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.46:4919@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.51:11939@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.63:16725@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.12:18473@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.115:12069@FSOfa5:EZaEVDGtbm' },
      { url: 'socks5://45.89.19.118:4099@FSOfa5:EZaEVDGtbm' }
    ]

    const pwrt: BrowserManager | null = await BrowserManager.build({
      browserType: chromium,
      launchOpts: {
        headless: false
      },
      device: devices['Pixel 5'],
      idleCloseSeconds: 60,
      maxOpenedBrowsers: 5

      // appPath: App.rootPath
    })

    // console.log('pwrt', pwrt)

    const page = await pwrt?.newPage({
      url: 'https://youtube.com'
    })
    // console.log('page', page)

    return { pwrt, page }
  } catch (e) {
    // console.log(e)
  }
  return {}
}

debug()
