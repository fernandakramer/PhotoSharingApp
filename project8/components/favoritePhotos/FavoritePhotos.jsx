import React from 'react';
import {
  Typography, Divider, Dialog
} from '@material-ui/core';
import './FavoritePhotos.css';
//import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';

class FavoritePhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      model: [],
      showDialog: false,
    };  
    this.handleOpenDialog = this.handleOpenDialog.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
  }

  handleOpenDialog = () => {
    this.setState({ showDialog: true });
  };

  handleCloseDialog () {
    this.setState({ showDialog: false });
  }

  getDialog = () => {
      if (this.state.photo){
          return(
            <Dialog 
            open={this.state.showDialog}
            >
                <div>
                    <button onClick={this.handleCloseDialog} className='close'>x</button>
                    <img src={"../images/" + this.state.photo.file_name} key={this.state.photo.file_name}></img>
                    <Typography className='time' key={this.state.photo.date_time}><i>Posted {this.state.photo.date_time}</i></Typography>
                </div>
            </Dialog>
          );
      }
      else {
          return(
              <div></div>
          );
      }
  };

  handleFavoritePhoto = (photo_id) => {
    axios.post('http://localhost:3000/favoritePhoto/', {photo_id: photo_id, has_favorited: true}) 
      .then(()=> {
        const new_model = this.state.model;
        for (let i = 0; i < new_model.length; i++){
        if (new_model[i]._id === photo_id){
            new_model.splice(i,1);
        }
        }
        this.setState({model: new_model});
        this.props.refreshUser();
      })
      .catch((error)=> {
        console.log(error);
      }); 
  };

  getFavoritePhoto = (photo_id) => {
    const has_favorited = this.props.user.favorites.includes(photo_id);
    return(
    <div className="likes_box">
        <button onClick={()=>this.handleFavoritePhoto(photo_id)}>
        <span className="material-icons">
        {has_favorited ? 'favorite' : 'favorite_border'}
        </span>
        </button>
    </div>
    );
  };

  componentDidMount(){
    let promise = axios.get("http://localhost:3000/getFavoritePhotosOfUser/" + this.props.user_id);
    
    // get favorite photos for user
    promise.then((res)=>{
      let result = res.data;
      this.setState({model: result});
      this.props.changeTitle('Your Favorite Photos');
      });
  }

  render() {
    if (this.state.model !== undefined && this.state.model.length !== 0) {
        return (
            <div>
                <div className='favorites_list'>
                {this.state.model.map(photo=> (
                    <div key={photo._id}>
                    <button className='button' onClick={() => {
                        this.handleOpenDialog(); 
                        this.setState({photo:photo});
                        }}>
                        <img src={"../images/" + photo.file_name} key={photo.file_name} className='thumbnail'></img>
                    </button>
                    {this.getFavoritePhoto(photo._id)}
                    <Divider/>
                    </div>
                ))}
                </div>
                {this.getDialog()}
            </div>
        );
      }
      else {
        return (
          <p>No favorites yet!</p>
        );
      }
    }
}

export default FavoritePhotos;
