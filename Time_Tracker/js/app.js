class TimersDashboard extends React.Component {
  state = {
    timers: [], // Exactly what it looks like: an empty array I'm naming "timers"

    /* Hard-coded objects that were in the array for initial testing

      {
        title: 'Practice squat',
        project: 'Gym Chores',
        id: uuid.v4(),
        elapsed: 5456099,
        runningSince: Date.now(),
      },
      {
        title: 'Bake squash',
        project: 'Kitchen Chores',
        id: uuid.v4(),
        elapsed: 127998,
        runningSince: null,
      },

    */
  };

  componentDidMount() {                             // Wait until the component actually mounts, before I start anything AJAX-y. Trying to load things
    this.loadTimersFromServer();                    // on the component before I've ensured the component has loaded would be bad. And, React will scream at you too.
    setInterval(this.loadTimersFromServer, 5000);   // Instead of hard-coding initial timers, load them from the data.JSON file on the server
  }

  loadTimersFromServer = () => {
    client.getTimers((serverTimers) => (
        this.setState({ timers: serverTimers })
      )
    );
  };

  updateTimer = (attrs) => {
    this.setState({
      timers: this.state.timers.map((timer) => {
        if (timer.id === attrs.id) {
          return Object.assign({}, timer, {         // I like Object.assign - it lets me make a new object and define what initial properties it has
            title: attrs.title,                     // useful tool when I have to completely dance around touching anything containing state
            project: attrs.project,                 // Because having duplicate states, or rewriting the set states would be bad. Just make copies and callbacks
          });
        } else {
          return timer;
        }
      }),
    });

    client.updateTimer(attrs);
  };

  // I prefer to write handlers at whatever component I think is the topmost owner for each piece of state, and pass them as props to the leaves.
  // So, this way I can embed components within each other, and logically keep state at the top/outermost component. When a change has to be made, use the
  // event handler function that calls back to the top. That way, unless a button or field really NEEDS to own state, it doesn't - it's parents do.
  handleCreateFormSubmit = (timer) => {
    this.createTimer(timer);
  };

  handleEditFormSubmit = (attrs) => {
    this.updateTimer(attrs);
  };

  handleTrashClick = (timerId) => {
    this.deleteTimer(timerId);
  };

  handleStartClick = (timerId) => {
    this.startTimer(timerId);
  };

  handleStopClick = (timerId) => {
    this.stopTimer(timerId);
  };

  createTimer = (timer) => {
    const t = helpers.newTimer(timer);
    this.setState({
      timers: this.state.timers.concat(t),
    });

    client.createTimer(t);
  };

  deleteTimer = (timerId) => {
    this.setState({
      timers: this.state.timers.filter(t => t.id !== timerId),
    });

    client.deleteTimer(
      { id: timerId }
    );
  };

  /* Okay. So, why manually make state change within React, instead of on the server? Why not just tell the server what action is being
  taken and update state based on the data on the server? While I COULD do something like:

  startTimer: function (timerId) {
    const now = Date.now();

    client.startTimer(
      { id: timerId, start: now }
    ).then(loadTimersFromServer);
  },

  Chain a .then() as startTimer() returns the original promise object. The last stage of startTimer invokes loadTimersFromServer.
  So... right after the server processes my start request, it makes another request asking for the list of timers, which will include
  the newly running timer. But... I'd be waiting to hear back from a server response to update the page. This isn't going to give an
  instant UI response, once you take it off of your local environment and put it on the internet. It's going to introduce a NOTICABLE delay
  between the action and the response. Just update the client before waiting the hear from the server. I'd rather duplicate state updates,
  on both the client and server than risk uncontrollable, varying unresponsiveness. This annoys me, at least, when interacting with pages.
  */

  startTimer = (timerId) => {
    const now = Date.now();

    this.setState({
      timers: this.state.timers.map((timer) => {
        if (timer.id === timerId) {
          return Object.assign({}, timer, {
            runningSince: now,
          });
        } else {
          return timer;
        }
      }),
    });

    client.startTimer(
      { id: timerId, start: now }
    );
  };

  stopTimer = (timerId) => {
    const now = Date.now();

    this.setState({
      timers: this.state.timers.map((timer) => {
        if (timer.id === timerId) {
          const lastElapsed = now - timer.runningSince;
          return Object.assign({}, timer, {
            elapsed: timer.elapsed + lastElapsed,
            runningSince: null,
          });
        } else {
          return timer;
        }
      }),
    });

    client.stopTimer(
      { id: timerId, stop: now }
    );
  };

// TimersDashboard is outermost, and references EditableTimerList and ToggleableTimerForm when it calls render, which I'm using as subcomponents
// These will call their own renders, which have subcomponents in the JSX, and so on and so forth all the way in a cascade all the way to the bottommost
// leaves. I really just want to call my render chain embedding everything I can within one component if I can.
  render() {
    return (
      <div className='ui three column centered grid'>
        <div className='column'>
          <EditableTimerList
            timers={this.state.timers}
            onFormSubmit={this.handleEditFormSubmit}
            onTrashClick={this.handleTrashClick}
            onStartClick={this.handleStartClick}
            onStopClick={this.handleStopClick}
          />
          <ToggleableTimerForm
            onFormSubmit={this.handleCreateFormSubmit}
          />
        </div>
      </div>
    );
  }
}

class ToggleableTimerForm extends React.Component {
  state={
    isOpen: false, // isOpen displays a button on false, and a blank editable form COMPONENT on true
  };               // this is really just a container for the form components

  handleFormOpen = () => {
    this.setState({ isOpen: true});
  }

  handleFormClose = () => {
    this.setState({ isOpen: false });
  };

  handleFormSubmit = (timer) => {
    this.props.onFormSubmit(timer);
    this.setState({ isOpen: false });
  };

  render() {
    if (this.state.isOpen) {
      return (
        <TimerForm
          onFormSubmit={this.handleFormSubmit}
          onFormClose={this.handleFormClose}
        />
      );
    } else {
      return (
        <div className='ui basic content center aligned segment'>
          <button
            className='ui basic button icon'
            onClick={this.handleFormOpen}
            >
            <i className='plus icon' />
          </button>
        </div>
      );
    }
  }
}

// The actual list of timer forms
class EditableTimerList extends React.Component {
  render() {
    const timers = this.props.timers.map((timer) => (
      <EditableTimer
        key={timer.id}
        id={timer.id}
        title={timer.title}
        project={timer.project}
        elapsed={timer.elapsed}
        runningSince={timer.runningSince}
        onFormSubmit={this.props.onFormSubmit} // I'm passing the handler functions as props, like callbacks
        onTrashClick={this.props.onTrashClick}
        onStartClick={this.props.onStartClick}
        onStopClick={this.props.onStopClick}
      />
    ));
    return (
      <div id='timers'>
        {timers}
      </div>
    );
  }
}

class EditableTimer extends React.Component {
  state = {
    editFormOpen: false,
  };

  handleEditClick = () => {
    this.openForm();
  };

  handleFormClose = () => {
    this.closeForm();
  };

  handleSubmit = (timer) => {
    this.props.onFormSubmit(timer);
    this.closeForm();
  };

  closeForm = () => {
    this.setState({ editFormOpen: false });
  };

  openForm = () => {
    this.setState({ editFormOpen: true });
  };

  render() {
    if (this.state.editFormOpen) {
      return (
        <TimerForm
          id={this.props.id}
          title={this.props.title}
          project={this.props.project}
          onFormSubmit={this.handleSubmit}
          onFormClose={this.handleFormClose}
        />
      );
    } else {
      return (
        <Timer
          id={this.props.id}
          title={this.props.title}
          project={this.props.project}
          elapsed={this.props.elapsed}
          runningSince={this.props.runningSince}
          onEditClick={this.handleEditClick}
          onTrashClick={this.props.onTrashClick}
          onStartClick={this.props.onStartClick}
          onStopClick={this.props.onStopClick}
        />
      );
    }
  }
}

class Timer extends React.Component {
  componentDidMount() {
    this.forceUpdateInterval = setInterval(() => this.forceUpdate(), 50);
  }

  componentWillUnmount() {
    clearInterval(this.forceUpdateInterval);
  }

  handleStartClick = () => {
    this.props.onStartClick(this.props.id);
  };

  handleStopClick = () => {
    this.props.onStopClick(this.props.id);
  };

  handleTrashClick = () => {
    this.props.onTrashClick(this.props.id);
  };

  render() {
    const elapsedString = helpers.renderElapsedString(
      this.props.elapsed, this.props.runningSince
    );
    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='header'>
            {this.props.title}
          </div>
          <div className='meta'>
            {this.props.project}
          </div>
          <div className='center aligned description'>
            <h2>
              {elapsedString}
            </h2>
          </div>
          <div className='extra content'>
            <span
              className='right floated edit icon'
              onClick={this.props.onEditClick}>
              <i className='edit icon' />
            </span>
            <span
              className='right floated trash icon'
              onClick ={this.handleTrashClick}
            >
              <i className='trash icon' />
            </span>
          </div>
        </div>
        <TimerActionButton
          timerIsRunning={!!this.props.runningSince}
          onStartClick={this.handleStartClick}
          onStopClick={this.handleStopClick}
        />
      </div>
    );
  }
}

class TimerForm extends React.Component {
  state = {
    title: this.props.title || '',
    project: this.props.project || '',
  };

  handleTitleChange = (e) => {
    this.setState({ title: e.target.value });
  };

  handleProjectChange = (e) => {
    this.setState({ project: e.target.value });
  };

  handleSubmit = () => {
    this.props.onFormSubmit({
      id: this.props.id,
      title: this.state.title,
      project: this.state.project,
    });
  };

  render() {
    const submitText = this.props.id ? 'Update' : 'Create';
    return (
      <div className='ui centered card'>
        <div className='content'>
          <div className='ui form'>
            <div className='field'>
              <label>Title</label>
              <input
                type='text'
                value={this.state.title}
                onChange={this.handleTitleChange}
              />
            </div>
            <div className='field'>
              <label>Project</label>
              <input
                type='text'
                value={this.state.project}
                onChange={this.handleProjectChange}
              />
            </div>
            <div className='ui two bottom attached buttons'>
              <button
                className='ui basic blue button'
                onClick={this.handleSubmit}
              >
                {submitText}
              </button>
              <button
                className='ui basic red button'
                onClick={this.props.onFormClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class TimerActionButton extends React.Component {
  render() {
    if (this.props.timerIsRunning) {
      return (
        <div
          className='ui bottom attached red basic button'
          onClick={this.props.onStopClick}
        >
          Stop
        </div>
      );
    } else {
      return (
        <div
          className='ui bottom attached green basic button'
          onClick={this.props.onStartClick}
        >
          Start
        </div>
      );
    }
  }
}

ReactDOM.render(
  <TimersDashboard />,
  document.getElementById('content')
);
