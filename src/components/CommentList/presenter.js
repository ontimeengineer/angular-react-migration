import React from 'react';
import PropTypes from 'prop-types';
import Comment from '../Comment';
import { getAngularService } from '../../services/AngularReactHelper';

const CommentList = ({ comments }) => {
    const AuthorService = getAngularService(document, 'AuthorService');

    return (
        <div>
            {comments.map((comment, index) => (
                <Comment
                    key={comment.id || index}
                    comment={comment}
                    author={AuthorService.getAuthor(comment.authorId)}
                />
            ))}
            <h1>TEST is on the way</h1>
        </div>
    );
};

CommentList.propTypes = {
    comments: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default CommentList;
