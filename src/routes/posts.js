const auth = require('../middleware/auth')({ tokenRequired: false });
const express = require('express');
const Post = require('../db/post');
const { validate, validateComment } = require('../model/post');
const validator = require('../middleware/validateReqParameters');
const validateObjectId = require('../middleware/validateObjectId');
const validatePost = require('../middleware/validatePost');

const router = express.Router();
const validateUserAndPost = validator.withUser(validate);
const validateCommentMiddleware = validator(validateComment);
const validatePostId = validateObjectId();

router.get('/', async (req, res) => {
    const posts = await Post.find();
    res.send(posts);
});

router.get('/:id', [validatePostId, validatePost], async (req, res) => {
    const post = req.postParam;

    res.send(post);
});

router.post('/', [auth, validateUserAndPost], async (req, res) => {
    const { activeUser, body } = req;

    const post = await Post.create(body, activeUser);

    res.send(post);
});

router.post('/:id/upvotes', [validatePostId, validatePost], async (req, res) => {
    const post = req.postParam;

    const { upVotes } = req.body;

    post.upVotes = upVotes;

    await post.save();

    res.send({ upVotes });
});

router.post('/:id/downvotes', [validatePostId, validatePost], async (req, res) => {
    const post = req.postParam;

    const { downVotes } = req.body;

    post.downVotes = downVotes;

    await post.save();

    res.send({ downVotes });
});

router.get('/:id/comments', [validatePostId, validatePost], async (req, res) => {
    const post = req.postParam;

    const { _id, comments } = post;

    res.send({ _id, comments });
});

router.post('/:id/comments', [auth, validatePostId, validatePost, validateCommentMiddleware], async (req, res) => {
    const post = req.postParam;

    let { text, user } = req.body;

    const activeUser = req.activeUser;

    if (activeUser) user = activeUser;

    try {
        const comment = await post.addComment({ text, user: user });
        res.send(comment);
    }
    catch (ex) {
        console.error(ex);
        res.status(500).send();
    }
});

module.exports = router;

