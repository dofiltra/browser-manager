import moment from 'moment'

class Disposable {
  protected _lastActivity: Date

  constructor() {
    this._lastActivity = new Date()
  }

  public lockClose(nextSeconds = 1) {
    this._lastActivity = moment(new Date()).add(nextSeconds, 'seconds').toDate()
  }
}

export { Disposable }
