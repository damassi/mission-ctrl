/* eslint no-console:0 */
import bunyan from 'bunyan'
import chalk from 'chalk'
import getConfig from './config'
import util from 'util'
import through from 'through2'

export const logStream = through.obj(function log(rec, encoding, callback) {
  const config = getConfig()
  let message = rec.msg

  if (typeof rec.msg === 'string') {
    if (rec.level === bunyan.WARN) {
      message = chalk.yellow(rec.msg)
    } else if (rec.level >= bunyan.ERROR) {
      message = chalk.red(rec.msg)
    }
  }

  if (config.verbose) {
    const pid = config.trace ? ' ' + chalk.grey(process.pid) : ''
    message = `[${chalk.blue(rec.name)}${pid}] ${message}`
  }

  this.push(message)
  callback()
})

/**
 * Create a logger with the given name.
 *
 * @param {String} name - the name for the logger (usually the module being
 *                        logged in)
 * @param {Number} [level] - an optional override for the loglevel
 * @return {Object} - the bunyan logger object
 */
export default function createLogger(name, level) {
  const config = getConfig()

  let loglevel = bunyan.INFO
  if (config.verbose) {
    loglevel = bunyan.DEBUG
  } else if (config.quiet) {
    loglevel = bunyan.WARN
  } else if (config.silent) {
    loglevel = bunyan.ERROR
  }

  if (process.env.NODE_ENV === 'test') {
    loglevel = bunyan.WARN
  }

  const settings = {
    name,
    streams: [
      {
        level: level || loglevel,
        type: 'raw',
        stream: logStream,
      },
    ],
  }

  return bunyan.createLogger(settings)
}

const timer = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance : Date

export const reduxLogger = () => next => action => {
  const config = getConfig()

  const blacklist = ['EFFECT_TRIGGERED', 'EFFECT_RESOLVED']
  if (!config.trace || blacklist.indexOf(action.type) !== -1) {
    return next(action)
  }

  const log = createLogger('state/store')
  const started = timer.now()

  let result
  let error = null
  try {
    result = next(action)
  } catch (err) {
    error = err
  }

  const duration = timer.now() - started

  if (error) {
    log.debug(`${chalk.magenta('action')} (${chalk.red('error')}) --> ${chalk.red(error)}`)
  } else {
    log.debug(`${chalk.magenta('action')} --> ${chalk.blue('type:')} ${action.type} ${chalk.blue('payload:')} ${util.inspect(action.payload, {colors: true})} (${chalk.yellow(duration)} ms)`)
  }

  return result
}
