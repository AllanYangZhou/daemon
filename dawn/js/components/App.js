import React from 'react';
import Joyride from 'react-joyride';
import DNav from './DNav';
import Dashboard from './Dashboard';
import RobotInfoStore from '../stores/RobotInfoStore';
import AlertStore from '../stores/AlertStore';
import AlertActions from '../actions/AlertActions';
import RuntimeConfig from './RuntimeConfig';
import joyrideSteps from './JoyrideSteps';
import smalltalk from 'smalltalk';
import { remote, ipcRenderer } from 'electron';
const storage = remote.require('electron-json-storage');

export default React.createClass({
  displayName: 'Dawn',
  getInitialState() {
    return {
      steps: [],
      consoleData: RobotInfoStore.getConsoleData(),
      isRunningCode: RobotInfoStore.getIsRunningCode(),
      connectionStatus: RobotInfoStore.getConnectionStatus(),
      runtimeStatus: RobotInfoStore.getRuntimeStatus(),
      batteryLevel: RobotInfoStore.getBatteryLevel(),
      runtimeVersion: RobotInfoStore.getRuntimeVersion()
    };
  },
  componentDidMount() {
    this.addSteps(joyrideSteps);
    RobotInfoStore.on('change', this.updateRobotInfo);
    AlertStore.on('change', this.updateAlert);
    ipcRenderer.on('start-interactive-tour', ()=>{
      this.startTour();
    });
    storage.has('firstTime').then((hasKey)=>{
      if (!hasKey) {
        this.startTour();
        storage.set('firstTime', {first: true}, (err)=>{
          if (err) throw err;
        });
      }
    });
  },
  componentWillUnmount() {
    RobotInfoStore.removeListener('change', this.updateRobotInfo);
    AlertStore.removeListener('change', this.updateAlert);
  },
  updateRobotInfo() {
    this.setState({
      consoleData: RobotInfoStore.getConsoleData(),
      isRunningCode: RobotInfoStore.getIsRunningCode(),
      connectionStatus: RobotInfoStore.getConnectionStatus(),
      runtimeStatus: RobotInfoStore.getRuntimeStatus(),
      batteryLevel: RobotInfoStore.getBatteryLevel(),
      runtimeVersion: RobotInfoStore.getRuntimeVersion()
    });
  },
  updateAlert() {
    let latestAlert = AlertStore.getLatestAlert();
    if (latestAlert !== undefined) {
      smalltalk.alert(latestAlert.heading, latestAlert.message).then(()=>{
        AlertActions.removeAlert(latestAlert);
      }, ()=>{
        AlertActions.removeAlert(latestAlert);
      });
    }
  },
  addSteps(steps) {
    let joyride = this.refs.joyride;
    if (!Array.isArray(steps)) {
      steps = [ steps ];
    }
    if (!steps.length) {
      return false;
    }
    this.setState((currentState) => {
      currentState.steps = currentState.steps.concat(joyride.parseSteps(steps));
      return currentState;
    });
  },
  addTooltip(data) {
    this.refs.joyride.addTooltip(data);
  },
  startTour() {
    this.refs.joyride.start(true);
  },
  completeCallback(steps, skipped) {
    this.refs.joyride.reset(false);
  },
  render() {
    return (
      <div>
        <DNav
          startTour={this.startTour}
          runtimeStatus={this.state.runtimeStatus}
          connection={this.state.connectionStatus}
          battery={this.state.batteryLevel}
          isRunningCode={this.state.isRunningCode}
        />
        <Joyride
          ref="joyride"
          steps={this.state.steps}
          type="continuous"
          showSkipButton={true}
          completeCallback={this.completeCallback}
          locale={{back: 'Previous', close: 'Close', last: 'End Tour', next: 'Next', skip: 'Skip Tour'}}
        />
        <div style={{ height: '60px', marginBottom: '21px' }}/>
        <Dashboard {...this.props}
          addSteps={this.addSteps}
          addTooltip={this.addTooltip}
          consoleData={this.state.consoleData}
	  connectionStatus={this.state.connectionStatus}
          runtimeStatus={this.state.runtimeStatus}
          isRunningCode={this.state.isRunningCode}
        />
        <RuntimeConfig
          connectionStatus={this.state.connectionStatus}
          runtimeVersion={this.state.runtimeVersion}/>
      </div>
    );
  }
});
