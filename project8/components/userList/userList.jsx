import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
}
from '@material-ui/core';
import './userList.css';
import {Link} from 'react-router-dom';
//import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';


class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user_list: [],
    };
  }

  componentDidMount() {
    axios.get('http://localhost:3000/user/list')
      .then((res)=> {
        let result = res.data;
        this.setState({user_list: result});
      })
      .catch((error)=> {
        console.log(error);
      });
  }

  render() {
    return (
      <div>
        <List component="nav">
            {this.state.user_list.map(user => (
              <ListItem component={Link} to={"/users/" + user._id} key={user._id}>
                <ListItemText 
                className="text" primary={user.first_name + ' ' + user.last_name}/>
              </ListItem>
                ))}
        </List>
      </div>
    );
  }
}

export default UserList;