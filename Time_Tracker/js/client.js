/* eslint-disable no-console */
/* eslint-disable no-undef */

// Okay. DO NOT DO "getTimers()" by itself. That isn't going to do anything useful. Need to pass it a "success" function.
// DO. NOT. TREAT. FUNCTIONS THAT MAKE REQUESTS. AS IF THEY ARE SYNCHRONOUS. THEY ARE NOT. You have NO idea when the request will complete.
// getTimers returns control flow immediately, program execution isn't going to wait for the server response.
// Instead, I'm doing a "success" callback thing once the server successfully returns with a result.
// Or, we could just write i/o blocking code, allowing everything to visibly grind to a halt. No, let's not.
window.client = (function () {
  function getTimers(success) {
    return fetch('/api/timers', {
      headers: {
        Accept: 'application/json', // Accept ONLY JSON
      },
    }).then(checkStatus)
      .then(parseJSON)
      .then(success);
  }

  function createTimer(data) {
    return fetch('/api/timers', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function updateTimer(data) {
    return fetch('/api/timers', {
      method: 'put',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function deleteTimer(data) {
    return fetch('/api/timers', {
      method: 'delete',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function startTimer(data) {
    return fetch('/api/timers/start', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function stopTimer(data) {
    return fetch('/api/timers/stop', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(checkStatus);
  }

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      const error = new Error(`HTTP Error ${response.statusText}`); // If you get an error, at least tell us what it is, and log it to the console so I can fix it
      error.status = response.statusText;                           // Silent failure that doesn't give me what the response is doesn't let me debug errors
      error.response = response;
      console.log(error);
      throw error;
    }
  }

  function parseJSON(response) {
    return response.json();
  }

  return {
    getTimers,
    createTimer,
    updateTimer,
    startTimer,
    stopTimer,
    deleteTimer,
  };
}());
