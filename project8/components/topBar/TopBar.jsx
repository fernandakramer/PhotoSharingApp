import React from 'react';
import {
  AppBar, Toolbar, Typography
} from '@material-ui/core';
import './TopBar.css';
import axios from 'axios';
import {Link} from 'react-router-dom';


class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      version: '',
    };
  }

  componentDidMount(){
    axios.get('http://localhost:3000/test/info')
      .then((res)=> {
        let result = res.data;
        this.setState({version: result.__v});
      })
      .catch((error)=> {
        console.log(error);
      });
  }

  addUploadButton = () =>{
    if (this.props.status === 'true') {
      return(
        <div className='upload'>
          <input type="file" accept="image/*" ref={(domFileRef) => { this.uploadInput = domFileRef; }} />
          <input type="submit" value="Upload" className='button' onClick={()=>this.handleUploadButtonClicked(event)}/>
        </div>
      );
    }
    else{
      return null;
    }
  };

  //this function is called when user presses the update button
  handleUploadButtonClicked = (e) => {
    e.preventDefault();
    if (this.uploadInput.files.length > 0) {

      // Create a DOM form and add the file to it under the name uploadedphoto
      const domForm = new FormData();
      domForm.append('uploadedphoto', this.uploadInput.files[0]);
      axios.post('/photos/new', domForm) 
        .then((res) => {
          console.log(res);
          axios.get('http://localhost:3000/photosOfUser/' + this.props.user)
            .then(()=> {
              console.log('photos updated');
            })
            .catch((error)=> {
              console.log(error);
            });
        })
        .catch(err => console.log(`POST ERR: ${err}`));
    }
  };

  addLogoutButton = () =>{
    if (this.props.status === 'true'){
      return(
        <div>
          <input type="submit" value="Logout" onClick={()=>this.handleLogout(event)}/>
        </div>
      );
    }
    else {
      return null;
    }
  };

  addFavoritesButton = () => {
    if (this.props.status === 'true'){
      return(
        <Link className="info" to={"/favorites"}>
          <button>Your Favorite Photos</button>
        </Link>
      );
    }
    else {
      return null;
    }
  };

  handleLogout = () => {
    axios.post('http://localhost:3000/admin/logout')
        .then(()=> {
            this.props.logout();
        })
        .catch((error)=> {
            console.log(error);
        }   
    );
  };

  render() {
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar className='toolbar'>
          <Typography variant="h5" color="inherit">
              Fernanda Kramer
          </Typography>
          {this.addUploadButton()}
          {this.addLogoutButton()}
          {this.addFavoritesButton()}
          <Typography variant='h5' className='right_side'>
              {this.props.title} v{this.state.version}
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

export default TopBar;