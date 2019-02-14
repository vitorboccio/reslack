import React, { Component } from 'react';
import firebase from '../../firebase';
import { Menu, Icon } from 'semantic-ui-react';

class DirectMessages extends Component {
  
  state = {
    users: [],
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    connectedRef: firebase.database().ref('.info/connected'),
    presenceRef: firebase.database().ref('presence'),
  }

  componentDidMount() {
    const { user } = this.state;
    if (user) {
      this.addListeners(user.uid);
    }
  }

  addListeners = currentUserUid => {
    const { usersRef, connectedRef, presenceRef } = this.state;
    let loadedUsers = [];
    usersRef.on('child_added', snap => {
      if ( currentUserUid !== snap.key ) {
        let user = snap.val();
        user['uid'] = snap.key;
        user['status'] = 'offline';
        loadedUsers.push(user);
        this.setState({ users: loadedUsers });
      }
    })
    connectedRef.on('value', snap => {
      if (snap.val() === true) {
        const ref = presenceRef.child(currentUserUid)
        ref.set(true);
        ref.onDisconnect().remove(err => {
          if (err !== null) {
            console.log(err);
          }
        });
      }
    });
    presenceRef.on('child_added', snap => {
      if (currentUserUid !== snap.key) {
        this.addStatusToUser(snap.key);
      }
    });


    presenceRef.on('child_removed', snap => {
      if (currentUserUid !== snap.key) {
        this.addStatusToUser(snap.key, false);
      }
    });
  } 

  addStatusToUser = (userId, connected = true) => {
    const { users } = this.state;
    const updatedUsers = users.reduce((acc, user) => {
      if (user.uid === userId) {
        user['status'] = `${connected ? 'online' : 'offline'}`;
      }
      return acc.concat(user);
    }, [])
    this.setState({ users: updatedUsers });
  }

  isUserOnline = user => user.status === 'online';

  render() {
    const { users } = this.state;
    console.log(this.state);
    return (
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="mail" /> Direct Message &nbsp;
          </span>
          ({users.length})
        </Menu.Item>
        {users.map(user => (
          <Menu.Item key={user.uid} onClick={e => console.log(user)} style={{ opacity: '.7', fontStyle: 'italic' }}>
            <Icon name="circle" color={this.isUserOnline(user) ? 'green' : null } />
            @ {user.name}
          </Menu.Item>
        ))}
      </Menu.Menu>
    )
  }
}


export default DirectMessages;
