import {getStore} from 'state/store'
import {workerReady} from 'workers/state'
import createLogger from 'utils/logging'

const log = createLogger('workers/utils')

export const workerInit = (worker, stateChanged) => () => {
  const store = getStore()

  console.log('worker ---->', worker)

  store.subscribe(stateChanged.bind(null, store))

  process.on('message', message => {
    log.debug(`Message received for ${worker}: ${message.type}`)
    store.dispatch(message)
  })

  process.send(workerReady(worker))

  log.debug(`Worker ${worker} successfully initialized`)
}
