import React, { Component } from 'react';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { API, Storage } from 'aws-amplify';
import config from '../config';
import LoaderButton from '../components/LoaderButton';
import { s3Upload } from '../libs/awsLib';
import './Notes.css';

export default class Notes extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
      isLoading: false,
      isDeleting: false,
      note: null,
      content: '',
      attachmentURL: null,
    };
  }

  componentDidMount = async () => {
    try {
      let attachmentURL;
      const note = await this.getNote();
      const { content, attachment } = note;

      if (attachment) {
        attachmentURL = await Storage.vault.get(attachment);
      }

      this.setState({ note, content, attachmentURL });

      // For diagnosis.
      console.log('Note info => ', note);
    } catch (error) {
      console.log('Fetching a Note is broken => ', error);
    }
  };

  getNote = () => {
    return API.get('notes', `/notes/${this.props.match.params.id}`);
  };

  validateForm = () => {
    return this.state.content.length > 0;
  };

  formatFilename = str => {
    return str.replace(/^\w+-/, '');
  };

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  handleFileChange = event => {
    this.file = event.target.files[0];
  };

  saveNote = note => {
    return API.put('notes', `/notes/${this.props.match.params.id}`, {
      body: note,
    });
  };

  handleSubmit = async event => {
    let attachment;
    event.preventDefault();

    if (this.file && this.file.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE /
          1000000} MB.`
      );
      return;
    }

    this.setState({ isLoading: true });

    try {
      if (this.file) {
        if (this.state.attachmentURL) {
          try {
            await Storage.vault.remove(this.state.note.attachment);
          } catch (error) {
            console.log(
              'Deleting existing image prior to uploading is broken => ',
              error
            );
          }
        }
        attachment = await s3Upload(this.file);
      }

      await this.saveNote({
        content: this.state.content,
        attachment: attachment || this.state.note.attachment,
      });
      this.props.history.push('/');
    } catch (error) {
      console.log('Editing Single Note is broken => ', error);
      this.setState({ isLoading: false });
    }
  };

  deleteNote = () => {
    return API.del('notes', `/notes/${this.props.match.params.id}`);
  };

  handleDelete = async event => {
    event.preventDefault();

    const confirmed = window.confirm(
      'Are you sure you want to delete this note?'
    );

    if (!confirmed) return;

    this.setState({ isDeleting: true });

    if (this.state.attachmentURL) {
      try {
        await Storage.vault.remove(this.state.note.attachment);
      } catch (error) {
        console.log('Deleting existing image is broken => ', error);
      }
    }

    try {
      await this.deleteNote();
      this.props.history.push('/');
    } catch (error) {
      console.log('Deleting a note broke => ', error);
      this.setState({ isDeleting: false });
    }
  };

  render() {
    return (
      <div className="Notes">
        {this.state.note && (
          <form onSubmit={this.handleSubmit}>
            <FormGroup controlId="content">
              <FormControl
                onChange={this.handleChange}
                value={this.state.content}
                componentClass="textarea"
              />
            </FormGroup>
            {this.state.note.attachment && (
              <FormGroup>
                <ControlLabel>Attachment</ControlLabel>
                <FormControl.Static>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={this.state.attachmentURL}
                  >
                    {this.formatFilename(this.state.note.attachment)}
                  </a>
                </FormControl.Static>
              </FormGroup>
            )}
            <FormGroup controlId="file">
              {!this.state.note.attachment && (
                <ControlLabel>Attachment</ControlLabel>
              )}
              <FormControl onChange={this.handleFileChange} type="file" />
            </FormGroup>
            <LoaderButton
              block
              bsStyle="primary"
              bsSize="large"
              disabled={!this.validateForm}
              type="submit"
              isLoading={this.state.isLoading}
              text="Save"
              loadingText="Saving ..."
            />
            <LoaderButton
              block
              bsStyle="danger"
              bsSize="large"
              isLoading={this.state.isDeleting}
              onClick={this.handleDelete}
              text="Delete"
              loadingText="Deleting ..."
            />
          </form>
        )}
      </div>
    );
  }
}
