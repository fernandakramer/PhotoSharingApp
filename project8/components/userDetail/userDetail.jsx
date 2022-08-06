import React from 'react';
import {
  Typography
} from '@material-ui/core';
import './userDetail.css';
import {Link} from 'react-router-dom';
//import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      model: [],
    };
  }

  handleDeleteUser = (user_id) => {
    axios.post('http://localhost:3000/admin/logout')
    .then(()=> {
        axios.post('http://localhost:3000/deleteUser', {user_id: user_id})
          .then(()=> {
              console.log('deleted user');
          })
          .catch((error)=> {
              console.log(error);
          }   
        );
        this.props.logout();
    })
    .catch((error)=> {
        console.log(error);
    });  
  };

  componentDidMount() {
    axios.get('http://localhost:3000/user/' + this.props.match.params.userId)
      .then((res)=> {
        let result = res.data;
        this.setState({model: result});
        this.props.changeTitle(this.state.model.first_name + ' ' + this.state.model.last_name);
      })
      .catch((error)=> {
        console.log(error);
      });
  }
  componentDidUpdate(prevProps){
    if (this.props.match.params.userId !== prevProps.match.params.userId){
      axios.get('http://localhost:3000/user/' + this.props.match.params.userId)
      .then((response)=> { 
        let result = response.data;
        this.setState({model: result});
        this.props.changeTitle(this.state.model.first_name + ' ' + this.state.model.last_name);
      })
      .catch((error)=> {
        console.log(error);
      });
   } 
  }
  componentWillUnmount(){
    this.props.changeTitle('');
  }

  addDeleteButton = (user_id) => {
    if (this.props.user_id === user_id){
      return(
        <button onClick={()=>this.handleDeleteUser(user_id)} className='delete button'>Delete Account</button>
      );
    }
    else {
      return null;
    }
  };

  render() {
    const userID = this.props.match.params.userId;
    return (
      <div className="details">
        <div className="name">{this.state.model.first_name} {this.state.model.last_name}</div>
        <Typography className="info"><b>Description: </b>{this.state.model.description}</Typography>
        <Typography className="info"><b>User ID: </b>{userID}</Typography>
        <Typography className="info"><b>Location: </b>{this.state.model.location}</Typography>
        <Typography className="info"><b>Occupation: </b>{this.state.model.occupation}</Typography>
        <Link className="info" to={"/photos/" + userID}>Photos</Link>
        <div>{this.addDeleteButton(userID)}</div>
      </div>
    );
  }
}

export default UserDetail;