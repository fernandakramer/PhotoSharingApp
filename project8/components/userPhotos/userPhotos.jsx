import React from 'react';
import {
  Typography, Divider
} from '@material-ui/core';
import './userPhotos.css';
import {Link} from 'react-router-dom';
//import fetchModel from '../../lib/fetchModelData';
import axios from 'axios';


class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      model: [],
      user: [],
      noCommentMsg: 'No Comments yet!',
      newComment: '',
      this_page_user: this.props.user,
    };  
  }

  handleFavoritePhoto = (photo_id, has_favorited) => {
    axios.post('http://localhost:3000/favoritePhoto/', {photo_id: photo_id, has_favorited: has_favorited}) 
      .then(()=> {
        const new_model = this.state.this_page_user;
        if(!has_favorited){
          new_model.favorites.push(photo_id);
        }
        if(has_favorited){
          for (let i = 0; i < new_model.favorites.length; i++){
            if (new_model.favorites[i] === photo_id){
              new_model.favorites.splice(i,1);
            }
          }
        }
        this.setState({this_page_user: new_model});
        this.props.refreshUser();
      })
      .catch((error)=> {
        console.log(error);
      }); 
  };

  handleDeletePhoto = (photo_id) => {
    axios.post('http://localhost:3000/deletePhoto', 
    {photo_id: photo_id})
      .then(()=> {
          console.log('deleted photo');
          axios.get('http://localhost:3000/photosOfUser/' + this.props.match.params.userId)
            .then((res)=> {
              let result = res.data;
              this.setState({model: result});
            })
            .catch((error)=> {
              console.log(error);
            });
      })
      .catch((error)=> {
          console.log(error);
      }   
    );
  };

  // delete a comment
  handleDeleteComment = (comment_id, photo_id) => {
    axios.post('http://localhost:3000/deleteComment', 
    {comment_id: comment_id, photo_id: photo_id})
      .then(()=> {
          console.log('deleted comment');
          axios.get('http://localhost:3000/photosOfUser/' + this.props.match.params.userId)
            .then((res)=> {
              let result = res.data;
              this.setState({model: result});
            })
            .catch((error)=> {
              console.log(error);
            });
      })
      .catch((error)=> {
          console.log(error);
      }   
    );
  };

  // like or unlike a photo
  handleLike = (photo_id, has_liked) => {
    axios.post('http://localhost:3000/likePhoto/', {photo_id: photo_id, has_liked: has_liked})  // use post to pass in another param to tell backed what to do
      .then(()=> {
        const new_model = this.state.model;
        for (let i = 0; i < new_model.length; i++){
          if (new_model[i]._id === photo_id){
            if (has_liked === false){
              new_model[i].likes.push(this.props.user_id);
            }
            if (has_liked === true){
              for (let j = 0; j < new_model[i].likes.length; j++) {
                if (new_model[i].likes[j] === this.props.user_id){
                  new_model[i].likes.splice(j,1);
                }
              }
            }
          }
        }
        this.setState({model: new_model});
      })
      .catch((error)=> {
        console.log(error);
      }); 
  };

  // add a new comment
  handleClick = (photo_id) => {
    axios.post('http://localhost:3000/commentsOfPhoto/:photo_id', 
    {newComment: this.state.newComment, photo_id: photo_id})
      .then(()=> {
          console.log('new Comment success');
          axios.get('http://localhost:3000/photosOfUser/' + this.props.match.params.userId)
            .then((res)=> {
              let result = res.data;
              this.setState({model: result});
              console.log('comment added');
            })
            .catch((error)=> {
              console.log(error);
            });
      })
      .catch((error)=> {
          console.log(error);
      }   
    );
  };

  componentDidMount(){
    let promise1 = axios.get("http://localhost:3000/photosOfUser/" + this.props.match.params.userId);
    let promise2 = axios.get("http://localhost:3000/user/" + this.props.match.params.userId);

    // access photos for user
    promise1.then((res)=>{
      let result1 = res.data;
      this.setState({model: result1});
      this.props.changeTitle('Photos of ' + this.state.user.first_name + ' ' + this.state.user.last_name);

      // access user information of user who commented
      promise2.then((response)=>{
        let result2 = response.data;
        this.setState({user: result2});
        this.props.changeTitle('Photos of ' + this.state.user.first_name + ' ' + this.state.user.last_name);
      }).catch((error) => {
          console.log(error);
      });
      }).catch((error) => {
        console.log(error);
      });
  }

  componentWillUnmount(){
      this.props.changeTitle('');
  }

  // retrieve the likes for each photo
  getLikes = (photo_id, photo) => {
    let has_liked = photo.likes.includes(this.props.user_id);
    return(
      <div className="likes_box">
        <button onClick={()=>this.handleLike(photo_id, has_liked)}>
          <span className="material-icons">
          {photo.likes.includes(this.props.user_id) ? 'thumb_down' : 'thumb_up'}
          </span>
        </button>
        <div className='number_of_likes'>  Number of likes: {photo.likes.length}</div>
      </div>
    );
  };

  // add a delete button
  addDeleteButton = (comment_user_id, comment_id, photo_id) => {
    if (this.props.user_id === comment_user_id){
      return(
        <button onClick={()=>this.handleDeleteComment(comment_id, photo_id)}>Delete Comment</button>
      );
    }
    else {
      return null;
    }
  };

  // retrieve the comments for each photo
  getComments = (comments, photo_id) => {
    if (comments !== undefined) {
      return(
        <div>
        {comments.map(elem => (
          <div key={elem._id}>
            <div className='comment' key={elem.comment}>
              <Link to={"/users/" + elem.user._id}>{elem.user.first_name + ' ' + elem.user.last_name}</Link>
                : {elem.comment} <div className="time"><i>{elem.date_time}</i>  {this.addDeleteButton(elem.user._id, elem._id, photo_id)}</div>
            </div>
          </div>
        ))}
        </div>
      );
    }
    else{
      return(
        <div className="time">{this.state.noCommentMsg}</div>
      );
    }
  };

  getDeletePhoto = (photo_id, user_id) => {
    if (this.props.user_id === user_id){
      return(
        <button onClick={()=>this.handleDeletePhoto(photo_id)}>Delete Photo</button>
      );
    }
    else {
      return null;
    }
  };

  getFavoritePhoto = (photo_id) => {
    if (this.props.match.params.userId === this.props.user_id){
      const has_favorited = this.state.this_page_user.favorites.includes(photo_id);
      return(
        <div className="likes_box">
          <button onClick={()=>this.handleFavoritePhoto(photo_id, has_favorited)}>
            <span className="material-icons">
            {has_favorited ? 'favorite' : 'favorite_border'}
            </span>
          </button>
        </div>
      );
    }
    else{
      return null;
    }
  };


  addTextBox = (photo_id) => {
    return(
      <div>
        <label>Add a new comment:  </label>
          <input
            type='text'
            onChange={(event) => this.handleCommentChange(event)}/>
          <input type="submit" value="Submit" onClick={()=>this.handleClick(photo_id)}/>
      </div>
    );
  };

  // automatically update the comment to be posted
  handleCommentChange(event) {
    this.setState({newComment: event.target.value});
  }


  render() {
    if (this.state.model !== undefined && this.state.model.length !== 0) {
      return (
        <div>
          {this.state.model.map(photo=> (
            <div className='photo_and_comments' key={photo._id}>
              <img src={"../images/" + photo.file_name} key={photo.file_name} className='photo'></img>
              <Typography className='time' key={photo.date_time}><i>Posted {photo.date_time}</i></Typography>
              {this.getDeletePhoto(photo._id, photo.user_id)} {this.getFavoritePhoto(photo._id)}
              {this.getLikes(photo._id, photo)}
              {this.getComments(photo.comments, photo._id)}
              {this.addTextBox(photo._id)}
              <Divider/>
            </div>
          ))}
        </div>
      );
    }
    else {
      return (
        <p>No photos yet!</p>
      );
    }
  }
}

export default UserPhotos;
