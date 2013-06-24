/* Moch event stream

This could be a websocket wrapper.

Usage:

    var stream = new MockStream()
    stream.pipe(someOtherPipeOrView)
    
    stream.run(milliseconds) // generate a new event struct every x milliseconds
-----------------------------------------------------*/
var MockStream = (function () {
  
  /* Random data points
  ---------------------------------------*/
  var apps = ['bootic_sites', 'bootic_api', 'bootic_admin', 'app1', 'app2', 'app3', 'app3']
  var accounts = ['account1', 'account2', 'account3', 'account4']
  var types = ['pageview', 'pageview', 'pageview', 'request', 'login', 'order', 'product']
  var descs = ["Lorem ipsum dolor", "dolor ipsum lorem", "foobar bar foo"]
  var users = ['John', 'Jane', 'Jim', 'Jake']
  
  /* Generate a random event
  ------------------------------------------*/
  function getEvent () {
    return {
      app: apps[Math.ceil(Math.random() * apps.length) - 1],
      account: accounts[Math.ceil(Math.random() * accounts.length) - 1],
      type: types[Math.ceil(Math.random() * types.length) - 1],
      user: users[Math.ceil(Math.random() * users.length) - 1],
      description: descs[Math.ceil(Math.random() * descs.length) - 1],
      date: new Date().getMilliseconds()
    }
  }
  
  /* Mock stream Pipe
  ------------------------------------*/
  var MockStream = Plumber.Pipe.extend({
    run: function (milli, times, c) {
      c = c || 1
      var self = this;
      this.running = true
      this.__interval = setTimeout(function () {
        self.add(new Plumber.Struct(getEvent()))
        if(!times || c < times) {
          ++c
          self.run(milli, times, c++)
        }
        
      }, milli)
    },
    
    stop: function () {
      clearTimeout(this.__interval)
      this.running = false
      return this
    },
    
    _add: function (item, promise) {
      var self = this
      setTimeout(function () {
        promise.resolve(item)
      }, 2)
    }
  })

  return MockStream
})()
