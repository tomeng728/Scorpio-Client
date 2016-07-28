/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  NavigatorIOS,
  ListView,
} from 'react-native'
import RNCalendarEvents from 'react-native-calendar-events';

const {NativeAppEventEmitter} = React;

var ContactLibrary = require('react-native-contacts');
var CalendarManager = NativeModules.CalendarManager;

// var Conversations = React.createClass({
//   getInitialState () {
//     const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
//     fetch('https://scorpio-backend.herokuapp.com/conversations', {
//       method: 'GET'
//       // body: JSON.stringify({
//       // username: username,
//       // password: password,
//       // }),
//       // headers: {
//       //  "content-type": "application/json"
//       // }H
//     })
//   }
// })

var Conversations = React.createClass({
  getInitialState() {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    fetch('https://scorpio-backend.herokuapp.com/conversations', {
      method: 'GET',
    })
    .then((response) => {
      return response.json()
    })
    .then((responseJson) => {
      console.log(responseJson)
      this.setState ({
        dataSource: ds.cloneWithRows(responseJson.conversations)
      });
    })
    .catch((err) => {
      console.log(err)
    })
    return {
      dataSource: ds.cloneWithRows([])
    };
  },
  touch (convo) {
    fetch ('http://localhost:3000/content/' + convo._id, {
      method: 'GET'
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.success) {
        // go to specific convo page
        // give it the data
        // let it render the data
        this.props.navigator.push({
          component: Content,
          title: 'Conversation Content',
          convo: responseJson.content
        })
      }
    })
  },
  render () {
    return <ListView
      dataSource={this.state.dataSource}
      renderRow={(convo) => <TouchableOpacity onPress={this.touch.bind(this, convo)}><Text>{convo.contact} {convo.date}</Text></TouchableOpacity>}
      // renderRow={(rowData) => <Text>{rowData.username}</Text>}
    />
  }
});

var Content = React.createClass({
  getInitialState() {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      proposedEvents: ds.cloneWithRows(this.props.convo.proposedEvents)
    }
  },
  press (evt) {
    RNCalendarEvents.saveEvent(evt.title, {
      location: 'location',
      notes: 'note',
      startDate: evt.start,
      endDate: evt.end
    });
  },
  render () {
    return (
      <View>
        <Text>this.props.convo.transcription</Text>
        <Text>this.props.convo.name</Text>
        <Text>this.props.convo.age</Text>
        <ListView
          dataSource={this.state.proposedEvents}
          renderRow={(event) => <TouchableOpacity onPress{this.press.bind(this, event)}><Text>{event.title}</Text></TouchableOpacity>}
        />
      </View>
    )
  }
});

var Contacts = React.createClass({
  getInitialState() {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

    console.log("contacts", ContactLibrary);

    ContactLibrary.checkPermission( (err, permission) => {
      // ContactLibrary.PERMISSION_AUTHORIZED || ContactLibrary.PERMISSION_UNDEFINED || ContactLibrary.PERMISSION_DENIED
      if(permission === 'undefined'){
        ContactLibrary.requestPermission( (err, permission) => {
          // ...
        })
      }
      if(permission === 'authorized'){
        // yay!
        ContactLibrary.getAll((err, contacts) => {
          console.log(contacts);
          if(err && err.type === 'permissionDenied'){
            console.log(err)
          } else {
            this.setState ({
              dataSource: ds.cloneWithRows(contacts)
            })
          }
        })
      }
      if (permission === 'denied'){
        // x.x
        console.log("sad boy")
        Alert.alert("sad boy")
      }
    })
    return {
      dataSource: ds.cloneWithRows([])
    }
  },
  press (contact) {
    console.log("Sending call")
    fetch('https://b708783f.ngrok.io/call',
    {
      method: 'POST',
      body: JSON.stringify({
        from: contact.phoneNumbers[0].number
      })
    })
    .then((resp) => console.log)
    .catch((resp) => console.log)
  },
  render () {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={(contact) => <TouchableOpacity onPress={this.press.bind(this, contact)} style={[styles.contacts]}><Text>{contact.givenName} {contact.familyName} </Text></TouchableOpacity>}
      />
    )
  }
});

var scorpioClient = React.createClass({
  render() {
    return (
      <NavigatorIOS
        initialRoute={{
          component: Login,
          title: "Login"
        }}
        style={{flex: 1}}
      />
    );
  }
});

var Register = React.createClass({
  press() {
    console.log("Sending something");
    fetch('http://localhost:3000/register', {
      method: 'POST',
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
      }),
      headers: {
        "content-type": "application/json"
      }
    })
  .then((response) => response.json())
  .then((responseJson) => {
    console.log("Success: ", responseJson)
  /* Upon success, go to login */
      if (responseJson.success) {
        this.props.navigator.pop()
      }
    })
  .catch((err) => {
  /* do something if there was an error with fetching */
      console.log(err);
    });
  },
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.textBig}>Register</Text>
        <TextInput
          style={{height: 40}}
          placeholder="Enter your phone number"
          onChangeText={(text) => this.setState({username: text})}
        />
        <TextInput
          style={{height: 40}}
          placeholder="Enter your password"
          onChangeText={(text) => this.setState({password: text})}
        />
        <TouchableOpacity onPress={this.press} style={[styles.button, styles.buttonGreen]}>
          <Text style={styles.buttonLabel}>Tap to Register</Text>
        </TouchableOpacity>
      </View>
    );
  }
});

var Login = React.createClass({
  press() {
    fetch('http://localhost:3000/login', {
      method: 'POST',
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password
      }),
      headers: {
        "content-type": "application/json"
      }
    })
  .then((response) => response.json())
  .then((responseJson) => {
  /* do something with responseJson and go back to the Login view but
   * make sure to check for responseJson.success! */
    if (responseJson.success) {
      this.props.navigator.push({
        component: Conversations,
        title: "Conversations",
        rightButtonTitle: 'Contacts',
        onRightButtonPress: this.contacts
      })
    }
  })
  .catch((err) => {
  /* do something if there was an error with fetching */
      console.log(err);
    });
  },
  register() {
    this.props.navigator.push({
      component: Register,
      title: "Register"
    });
  },
  contacts() {
    this.props.navigator.push({
      component: Contacts,
      title: "Contacts"
    })
  },
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.textBig}>Login to Scorpio!</Text>
        <TextInput
          style={{height: 40}}
          placeholder="Enter your phone number"
          onChangeText={(text) => this.setState({username: text})}
        />
        <TextInput
          style={{height: 40}}
          placeholder="Enter your password"
          onChangeText={(text) => this.setState({password: text})}
        />
        <TouchableOpacity onPress={this.press} style={[styles.button, styles.buttonGreen]}>
          <Text style={styles.buttonLabel}>Tap to Login</Text>
        </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonBlue]} onPress={this.register}>
          <Text style={styles.buttonLabel}>Tap to Register</Text>
        </TouchableOpacity>
      </View>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  containerFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  textBig: {
    fontSize: 36,
    textAlign: 'center',
    margin: 10,
  },
  contacts: {
    marginTop: 2, 
    marginBottom: 3,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    color: 'white'
  },
  button: {
    alignSelf: 'stretch', 
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 10,
    marginLeft: 30,
    marginRight: 30,
    borderRadius: 5
  },
  buttonRed: {
    backgroundColor: '#FF585B', 
  },
  buttonGreen: {
    backgroundColor: '#003366',
    color: 'white'
  },
  buttonBlue: {
    backgroundColor: '#001B36',
    color: 'white'
  },
  buttonLabel: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white'
  }
});

AppRegistry.registerComponent('scorpioClient', () => scorpioClient);
