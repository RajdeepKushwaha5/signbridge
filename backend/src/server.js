import { config } from './config.js'
import { createApp } from './app.js'

createApp().listen(config.port, () => {
  console.log(`SignBridge API listening on port ${config.port}`)
})
