import { devices, chromium } from 'playwright'
import { BrowserManager } from '.'

const debug = async () => {
  try {
    const pwrt: BrowserManager | null = await BrowserManager.build({
      browserType: chromium,
      launchOpts: {
        headless: true
      },
      device: devices['Pixel 5'],
      idleCloseSeconds: 60,
      maxOpenedBrowsers: 5
      // appPath: App.rootPath
    })

    // console.log('pwrt', pwrt)

    const page = await pwrt?.newPage({})
    await page?.goto('https://dofiltra.com')
    // console.log('page', page)

    return { pwrt, page }
  } catch (e) {
    // console.log(e)
  }
  return {}
}

debug()
