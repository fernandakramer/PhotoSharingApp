import React from 'react';
import axios from 'axios';
import './LoginRegister.css';

class LoginRegister extends React.Component {
    constructor(props) {
      super(props);
      this.state={
        username: '',
        password: '',
        new_first_name: '',
        new_last_name: '',
        new_username: '',
        new_password: '',
        new_password_2: '',
        location: '',
        occupation: '',
        description: ''
      };

      this.handleClick = this.handleClick.bind(this);
    }
    
    handleClick() {
        axios.post('http://localhost:3000/admin/login', {login_name: this.state.username, password: this.state.password})
            .then((res)=> {
                const user = res.data;
                this.props.setUserObject(user);
                const name = user.first_name + ' ' + user.last_name;
                this.props.changeLoggedInStatus('true');
                this.props.changeTitle('Hello '+ name);
                this.props.setUser(user._id);
            })
            .catch((error)=> {
                console.log(error);
            }   
        );
    }

    handleRegister(){
        if (this.state.new_password !== this.state.new_password_2){
            console.log("passwords do not match");
            this.setState({new_first_name: ''});
            this.setState({new_last_name: ''});
            this.setState({new_username: ''});
            this.setState({new_password: ''});
            this.setState({new_password_2: ''});
            this.setState({location: ''});
            this.setState({description: ''});
            this.setState({occupation: ''});
        }
        else{
            axios.post('http://localhost:3000/user', 
            {first_name: this.state.new_first_name, last_name: this.state.new_last_name, username: this.state.new_username, password: this.state.new_password, location: this.state.location, description: this.state.description, occupation: this.state.occupation})
                .then(()=> {
                    console.log('registered!');
                    this.setState({new_first_name: ''});
                    this.setState({new_last_name: ''});
                    this.setState({new_username: ''});
                    this.setState({new_password: ''});
                    this.setState({new_password_2: ''});
                    this.setState({location: ''});
                    this.setState({description: ''});
                    this.setState({occupation: ''});
                })
                .catch((error)=> {
                    console.log(error);
                }   
            );
        }
    }

    handleUsernameChange(event) {
        this.setState({username: event.target.value});
    }

    handlePasswordChange(event) {
        this.setState({password: event.target.value});
    }

    handleFirstNameChange(event) {
        this.setState({new_first_name: event.target.value});
    }

    handleLastNameChange(event) {
        this.setState({new_last_name: event.target.value});
    }
    handleNewUsernameChange(event) {
        this.setState({new_username: event.target.value});
    }

    handleNewPasswordChange(event) {
        this.setState({new_password: event.target.value});
    }

    handleNewPassword_2_Change(event) {
        this.setState({new_password_2: event.target.value});
    }

    handleLocationChange(event) {
        this.setState({location: event.target.value});
    }

    handleDescriptionChange(event) {
        this.setState({description: event.target.value});
    }

    handleOccupationChange(event) {
        this.setState({occupation: event.target.value});
    }
  
    componentDidMount() {
        this.props.changeTitle("Please Login");
    }
    componentWillUnmount(){
      this.props.changeTitle('');
    }
  
    render() {
      return (
        <div className='loginRegister'>
            <div className='loginArea'>
                <div><b>Login: </b></div>
                <label>Username:  </label>
                <input
                    type='text' value={this.state.username}
                    onChange={(event) => this.handleUsernameChange(event)}/>
                <label>Password:  </label>
                <input
                    type='text' value={this.state.password}
                    onChange={(event) => this.handlePasswordChange(event)}/>
                <input type="submit" value="Submit" onClick={()=>this.handleClick()}/>
            </div>
            <div className='registerArea'>
                <div><b>Register: </b></div>
                <label>First Name:  </label>
                <input
                    type='text' value={this.state.new_first_name}
                    onChange={(event) => this.handleFirstNameChange(event)}/>
                <label>Last Name:  </label>
                <input
                    type='text' value={this.state.new_last_name}
                    onChange={(event) => this.handleLastNameChange(event)}/>
                <label>Username:  </label>
                <input
                    type='text' value={this.state.new_username}
                    onChange={(event) => this.handleNewUsernameChange(event)}/>
                <label>Password:  </label>
                <input
                    type='text' value={this.state.new_password}
                    onChange={(event) => this.handleNewPasswordChange(event)}/>
                <label>Re-enter Password:  </label>
                <input
                    type='text' value={this.state.new_password_2}
                    onChange={(event) => this.handleNewPassword_2_Change(event)}/>
                <label>Location:  </label>
                <input
                    type='text' value={this.state.location}
                    onChange={(event) => this.handleLocationChange(event)}/>
                <label>Description:  </label>
                <input
                    type='text' value={this.state.description}
                    onChange={(event) => this.handleDescriptionChange(event)}/>
                <label>Occupation:  </label>
                <input
                    type='text' value={this.state.occupation}
                    onChange={(event) => this.handleOccupationChange(event)}/>
                <input type="submit" value="Register Me" onClick={()=>this.handleRegister()}/>
            </div>
        </div>
      );
    }
}
  
  export default LoginRegister;