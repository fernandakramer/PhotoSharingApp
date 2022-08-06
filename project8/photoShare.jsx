import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Paper
} from '@material-ui/core';
import './styles/main.css';
import axios from 'axios';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/loginRegister/LoginRegister';
import FavoritePhotos from './components/favoritePhotos/FavoritePhotos';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      title: '',
      loggedInStatus: 'false',
      loggedInUser: '',
      userObject: {},
    };

  }

  // add event handler to be passed in as a prop and change the title in the TopBar component  
  changeTitle = (newTitle) => {
    this.setState({title: newTitle});
  };

  setUser = (newUser) => {
    this.setState({loggedInUser: newUser});
  };

  refreshUser = () => {
    if(this.state.loggedInUser){
      axios.get('http://localhost:3000/user/' + this.state.loggedInUser)
      .then((response)=> { 
        let result = response.data;
        this.setState({userObject: result});
      })
      .catch((error)=> {
        console.log(error);
      });
    }
  };

  changeLoggedInStatus = (value) => {
    this.setState({loggedInStatus: value});
  };

  setUserObject = (newUser) => {
    this.setState({userObject: newUser});
  };

  checkLoggedInStatus = () => {
    if (this.state.loggedInStatus === 'true'){
      return false;
    }
    else {
      return true;
    }
  };

  logout = () => {
    this.setState({loggedInUser: ''});
    this.setState({loggedInStatus: 'false'});
  };

  render() {
    //console.log(this.userIsLoggedIn());
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar title={this.state.title} status={this.state.loggedInStatus} changeLoggedInStatus={this.changeLoggedInStatus} logout={this.logout} user={this.state.loggedInUser}/>
        </Grid>
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3}>
          <Paper className="cs142-main-grid-item">
            {
            (this.state.loggedInStatus === 'true') ?
            <UserList />
            : <Redirect path="" to="/login-register" />
            }
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item">
            <Switch>
                {
                  (this.state.loggedInUser ==='') ?
                  <Route path="/login-register" render={ props => <LoginRegister {...props} changeTitle={this.changeTitle} changeLoggedInStatus={this.changeLoggedInStatus} setUser={this.setUser} setUserObject={this.setUserObject}/> }/>
                  :
                  <Redirect path="/login-register" to={"/users/"+this.state.loggedInUser} />
                }
                {
                  (this.state.loggedInStatus === 'true') ? 
                  <Route path="/users/:userId" render={ props => <UserDetail {...props} changeTitle={this.changeTitle} logout={this.logout} user_id={this.state.loggedInUser}/> }/>
                  :
                  <Redirect path="/users/:id" to="/login-register" />
                }
                {
                  (this.state.loggedInStatus === 'true') ? 
                  <Route path="/photos/:userId" render ={ props => <UserPhotos {...props} changeTitle={this.changeTitle} user_id={this.state.loggedInUser} user={this.state.userObject} refreshUser={this.refreshUser} /> }/>
                  :
                  <Redirect path="/photos/:id" to="/login-register" />
                }

                {
                  (this.state.loggedInStatus === 'true') ? 
                  <Route path="/favorites" render ={ props => <FavoritePhotos {...props} changeTitle={this.changeTitle} user_id={this.state.loggedInUser} user={this.state.userObject} setUser={this.setUser} refreshUser={this.refreshUser}/> }/>
                  :
                  <Redirect path="/favorites" to="/login-register" />
                }

                  <Route path="/users" component={UserList}/>

                {
                  (this.state.loggedInStatus === 'true') ? 
                  <Route path="/" to={"/users/" + this.state.loggedInUser}/>
                  :
                  <Redirect path="/" to="/login-register" />
                }
            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
      </HashRouter>
    );
  }
}


ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);


// {
//   (this.state.loggedInStatus === 'true') ? 
//   <Route path="/favorites" render ={ props => <FavoritePhotos {...props} changeTitle={this.changeTitle} user_id={this.state.loggedInUser} user={this.state.userObject}/> }/>
//   :
//   <Redirect path="/favorites" to="/login-register" />
// }

//<Route path="/favorites" component={FavoritePhotos} changeTitle={this.changeTitle} user_id={this.state.loggedInUser} user={this.state.userObject}/>