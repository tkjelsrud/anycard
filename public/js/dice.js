'use strict';

const e = React.createElement;

class Dice extends React.Component {
  constructor(props) {
    super(props);
    this.value = Math.floor(Math.random() * 6) + 1;
  }

  render() {
    return (<img src={this.value}/>);
  }
}

const domContainer = document.querySelector('#card_container');
ReactDOM.render(e(Dice), domContainer);
