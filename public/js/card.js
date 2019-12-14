'use strict';

const e = React.createElement;

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return e(
      'button',
      { onClick: () => {
        this.setState({ liked: true });
        emitUpdate('I like it');
      } },
      'Like'
    );
  }
}

const domContainer = document.querySelector('#card_container');
ReactDOM.render(e(Card), domContainer);
