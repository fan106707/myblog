var marked = require('marked');
var Post = require('../lib/mongo').Post;
var CommentModel = require('./comments');

// �� post ��������� commentsCount
Post.plugin('addCommentsCount', {
  afterFind: function (posts) {
    return Promise.all(posts.map(function (post) {
      return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
        post.commentsCount = commentsCount;
        return post;
      });
    }));
  },
  afterFindOne: function (post) {
    if (post) {
      return CommentModel.getCommentsCount(post._id).then(function (count) {
        post.commentsCount = count;
        return post;
      });
    }
    return post;
  }
});


// �� post �� content �� markdown ת���� html
Post.plugin('contentToHtml', {
  afterFind: function (posts) {
    return posts.map(function (post) {
      post.content = marked(post.content);
      return post;
    });
  },
  afterFindOne: function (post) {
    if (post) {
      post.content = marked(post.content);
    }
    return post;
  }
});

module.exports = {
  // ����һƪ����
  create: function create(post) {
    return Post.create(post).exec();
  },

  // ͨ������ id ��ȡһƪ����
  getPostById: function getPostById(postId) {
    return Post
      .findOne({ _id: postId })
      .populate({ path: 'author', model: 'User' })
      .addCreatedAt()
	  .addCommentsCount()
      .contentToHtml()
      .exec();
  },

  // ������ʱ�併���ȡ�����û����»���ĳ���ض��û�����������
  getPosts: function getPosts(author) {
    var query = {};
    if (author) {
      query.author = author;
    }
    return Post
      .find(query)
      .populate({ path: 'author', model: 'User' })
      .sort({ _id: -1 })
      .addCreatedAt()
	  .addCommentsCount()
      .contentToHtml()
      .exec();
  },

  // ͨ������ id �� pv �� 1
  incPv: function incPv(postId) {
    return Post
      .update({ _id: postId }, { $inc: { pv: 1 } })
      .exec();
  },
  
 // ͨ������ id ��ȡһƪԭ�����£��༭���£�
getRawPostById: function getRawPostById(postId) {
  return Post
    .findOne({ _id: postId })
    .populate({ path: 'author', model: 'User' })
    .exec();
},

// ͨ���û� id ������ id ����һƪ����
updatePostById: function updatePostById(postId, author, data) {
  return Post.update({ author: author, _id: postId }, { $set: data }).exec();
},

// ͨ���û� id ������ id ɾ��һƪ����
delPostById: function delPostById(postId, author) {
  return Post.remove({ author: author, _id: postId })
    .exec()
    .then(function (res) {
      // ����ɾ������ɾ���������µ���������
      if (res.result.ok && res.result.n > 0) {
        return CommentModel.delCommentsByPostId(postId);
      }
    });
}
  
  
  
};