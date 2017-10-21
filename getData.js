var mongoose = require("mongoose");
var db = mongoose.connect('mongodb://heroku_2pljwfrr:e5bper0f65s64g9uijhof85baa@ds121345.mlab.com:21345/heroku_2pljwfrr');//process.env.MONGODB_URI == 'mongodb://heroku_2pljwfrr:e5bper0f65s64g9uijhof85baa@ds121345.mlab.com:21345/heroku_2pljwfrr'
var Images = require('./models/classifications');
urls = ['http://webneel.com/daily/sites/default/files/images/daily/04-2013/24-birds-award-winning-photography.jpg', 'http://insider.si.edu/wordpress/wp-content/uploads/2017/04/SCTA-copy.jpg', 'https://i.pinimg.com/736x/ff/c8/ff/ffc8ffa6d6e83c383aead2c3a4c663c1--wild-animals-rare-animals.jpg', 'https://static.pexels.com/photos/9291/nature-bird-flying-red.jpg', 'http://images.all-free-download.com/images/graphicthumb/pigeon_birds_macro_215473.jpg', 'https://www.scienceabc.com/wp-content/uploads/2015/09/strong-bird.jpg', 'http://www.qygjxz.com/data/out/29/5807877-birds-picture.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsfi9WgHTDUF2mIbb_HIdDe8616uiDqHB92iby5nkLlbuVzRrVmg', 'https://i.pinimg.com/736x/5f/51/0b/5f510bbc10345b91b189bf45dde83ddb--cute-birds-pretty-birds.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTukY8QMAFPvicGYHgNdfxluxGUo5CySpJnO4-vzF9c81Qc5lu', 'http://stylesatlife.com/wp-content/uploads/2015/11/types-of-birds-1.jpg', 'https://s-media-cache-ak0.pinimg.com/originals/2a/bd/f2/2abdf2c68781c34884d32194a998f380.jpg', 'https://static.independent.co.uk/s3fs-public/styles/article_small/public/thumbnails/image/2017/03/23/17/electricplane.jpg']
urls.forEach(function(url_){
  var newI = new Images({
    image_url: url_,
    status: 'not classified'
  }, function(err){
    if (err) return console.log(err);
  });

  newI.save(function(err){
    if (err) return console.log(err);
  });
})
/*
var newI = new Images({
  image_url: url_,
  status: 'not classified'
}, function(err){
  if (err) return console.log(err);
});

newI.save(function(err){
  if (err) return console.log(err);
});
*/
