const uuid = require('uuid');

// fetch url used. Change index of urlUsed to change everywhere. 0 for local hosting, 1 for heroku
const fetchUrls = ["http://localhost:3000", "https://journaling-website.herokuapp.com"]
const urlUsed = fetchUrls[1]

// const variables used to select base html elements
const gallery = document.querySelector('#gallery')
const greyBox = document.querySelector("#greyed-out")
const commentBox = document.querySelector('#comment-section')
const innerCommentBox = document.querySelector('.inner-comment-box')
const commentScrollSection = document.querySelector('.comment-create')
const form = document.querySelector('#comment-form')
const loadBtn = document.querySelector("#load-btn");

// let variables used to hold arrays of objects and certain values
let newestArray = [];
let postArray = [];
let emojiArray = [];
let pageNum = 1;
let holdsPostID;


// Listens for when 
form.addEventListener("submit", postComment)
loadBtn.addEventListener("click", getPosts)
window.addEventListener("beforeunload", unload)
greyBox.addEventListener("click", () => {
    greyBox.style.zIndex = "-100"
    commentBox.style.zIndex = "-100"
    innerCommentBox.textContent = ''
})

// Class used to handle Posts
class Post {
    // Post properties
    constructor(data) {
        this.id = data.id
        this.timestamp = data.timestamp
        this.title = data.title;
        this.body = data.body.text;
        this.gifUrl = data.body.gifUrl;
        this.comments = data.comments;
        this.likeCount = data.emojis.likeCount;
        this.loveCount = data.emojis.loveCount;
        this.laughCount = data.emojis.laughCount;
    }

    // returns an array of Post objects using postArray
    static get all() {
        const posts = newestArray.map((data) => new Post(data));
        return posts;
    }

    // used on Post objects, to load posts on the website
    get draw() {
        // create all the elements used to make a post in html
        const postCard = document.createElement("div")
        const postTop = document.createElement("div")
        const postBody = document.createElement("div")
        const postBottom = document.createElement("div")
        const postHeading = document.createElement("h4")
        const postBodyGif = document.createElement("img")
        const postBodyText = document.createElement("p")
        const emojisContainer = document.createElement("div")
        const emojiButton1 = document.createElement("div")
        const emojiButton2 = document.createElement("div")
        const emojiButton3 = document.createElement("div")
        const commentsButton = document.createElement("div")

        // assign each element their relevant css classes
        postCard.classList.add("post-card")    
        postTop.classList.add("post-top")    
        postBody.classList.add("post-body")    
        postBottom.classList.add("post-bottom")       
        postHeading.classList.add("post-heading")        
        postBodyGif.classList.add("post-body-gif")
        postBodyText.classList.add("post-body-text")
        emojisContainer.classList.add("emojis-container")
        emojiButton1.classList.add("emoji-button")
        emojiButton1.setAttribute("value", "likeCount")
        emojiButton2.classList.add("emoji-button")
        emojiButton2.setAttribute("value", "loveCount")
        emojiButton3.classList.add("emoji-button")
        emojiButton3.setAttribute("value", "laughCount")
        commentsButton.classList.add("comments-button")
        
        // lists used to help append each element to their respective parent elements
        const postCardList = [postTop, postBody, postBottom]
        const postTopList = [postHeading]
        const postBodyList = [postBodyGif, postBodyText]
        const postBottomList = [emojisContainer, commentsButton]
        const emojisContainerList = [emojiButton1, emojiButton2, emojiButton3]

        // Gives the relevent content to each element
        postHeading.textContent = this.title
        postBodyGif.src = this.gifUrl
        postBodyText.textContent = this.body
        emojiButton1.textContent = "👍 " + this.likeCount
        emojiButton2.textContent = "😍 " + this.loveCount
        emojiButton3.textContent = "😂 " + this.laughCount
        commentsButton.textContent = "comments"
        commentsButton.id = this.id

        // appending each element to their respective positions
        gallery.append(postCard)
        postCardList.forEach(element => postCard.append(element))
        postTopList.forEach(element => postTop.append(element))
        postBodyList.forEach(element => postBody.append(element))
        postBottomList.forEach(element => postBottom.append(element))
        
        // checks if gifUrl is empty, removes it from Post if empty
        if (!this.gifUrl) {
            postBodyGif.remove()
        }
        
        // adds event listener to comment button. Greys screen and brings up comment box
        commentsButton.addEventListener("click", (e) => {
            holdsPostID = e.target.id
            greyBox.style.zIndex = "99"
            commentBox.style.zIndex = "100"
            innerCommentBox.style.zIndex = "101"
            commentScrollSection.style.zIndex = "101"
            appendComments(e.target.id)
        })

        // adds event listener to each emoji button element in post. Toggles class and changes count of emoji
        emojisContainerList.forEach(element => {
            emojisContainer.append(element)
            element.addEventListener("click", () => {
                element.classList.toggle("emoji-clicked");
                const index = emojiArray.findIndex(element => element.id === commentsButton.id);
                let emojiSymbol = element.textContent.slice(0, 2)
                let numEmoji = element.textContent.slice(2)
                if (element.classList.contains("emoji-clicked")) {
                    emojiArray[index].emojis[element.getAttribute("value")] = true;
                    element.textContent = emojiSymbol + (Number(numEmoji)+1);
                } else {
                    emojiArray[index].emojis[element.getAttribute("value")] = false;
                    element.textContent = emojiSymbol + (Number(numEmoji)-1);
                }
            })
        })
    }

    // calls draw method on each Post in array returned from Post.all, and clears newestArray
    static drawAll() {
        let arr = Post.all
        arr.forEach(post => post.draw)
        newestArray = [];
    }
}

getPosts();

// new appendComments function, will try to fetch new comments before loading them
async function appendComments(id) {
    try {
        let res = await fetch(`${urlUsed}/search/${id}`)
        let data = await res.json()
        let newComments = data.entry.comments
        const index = postArray.findIndex(element => element.id == holdsPostID)
        postArray[index].comments = newComments
    } catch(e) {
        console.log(e)
    }
    let post = postArray.filter(post => post.id === id)[0]
    let comments = post.comments
    comments.forEach(comment => drawComment(comment))
}

// on default, appends a comment to the inner-comment-box section
function drawComment(comment, append=true) {
    // creates the comment elements
    let commentCard = document.createElement("div")
    commentCard.classList.add("comment-card")
    let commentDate = document.createElement("p")
    commentDate.classList.add("comment-date")
    let commentBody = document.createElement("p")
    commentBody.classList.add("comment-body")

    //assigns relevent content to each element
    commentCard.id = comment.id
    commentDate.textContent = dateFormat(comment.time)
    commentBody.textContent = comment.body

    // structures the comment element and appends in order
    let commentCardList = [commentDate, commentBody]
    commentCardList.forEach(element => commentCard.append(element))

    // on default, appends the comment to the box, else prepends it if false
    append ? innerCommentBox.append(commentCard) : innerCommentBox.prepend(commentCard)
}

// used to format the date from a timestamp
function dateFormat(timestamp){
    const date = new Date(timestamp)
    let checkArray = [date.getHours(), date.getMinutes(),date.getDate()]
    let newArray = [];
    checkArray.forEach(num => {
        if (num.toString().length == 1) {
            newArray.push("0" + num)
        } else {
            newArray.push(num)
        }
    })
    return newArray[0] +":" + newArray[1] + " " + newArray[2] + "/" + (date.getMonth()+1) + "/" + date.getFullYear()
}

// Runs when user clicks on submit comment. Sends commment to server and prepends comment on client
async function postComment(e){
    e.preventDefault()
    const input = e.target.commentInput.value
    if (input) {
        let commentData = {
            id: uuid.v4(),
            body: input,
            time: Date.now()
        }

        const index = postArray.findIndex(element => element.id == holdsPostID)
        postArray[index].comments.unshift(commentData)

        const options = {
            method: "POST",
            body: JSON.stringify(commentData),
            headers: {
                "Content-Type": "application/json"
            }
        }
        let res = await fetch(`${urlUsed}/update/comments/${holdsPostID}`, options)
        drawComment(commentData, false)
        e.target.commentInput.value = ""
    }
}

// Gets posts from server 12 at a time using page number system. If there are no more pages left, runs catch block
async function getPosts(e) {
    try{
        response = await fetch(`${urlUsed}/search/page/${pageNum}`);
        data = await response.json();
        data.entries.forEach(post => {
            if (!postArray.map(entry => entry.id).includes(post.id)) {
                newestArray.push(post);
                postArray.push(post);
                emojiArray.push({id: post.id, emojis: {loveCount: false, laughCount: false, likeCount: false}})
            };
        });
        Post.drawAll();
        pageNum++
        if(pageNum > data.totalPages){
            document.querySelector("#load-btn").style.display = "none";
            const noMore = document.createElement("p");
            noMore.textContent = "No more posts to load!";
            noMore.setAttribute("class", "no-more-msg")
            document.querySelector("#the-biggest-id-in-this-project").append(noMore);
        }
    } catch(err) {
        console.log(err);
    }
}

// when user refreshes, navigates away from or closes the page, post the emoji clicked data
async function unload(e) {    
    let options = {
        method: "POST",
        body: JSON.stringify({emojis: emojiArray}),
        headers: { "Content-Type": "application/json" }
    }
    try{
        await fetch(`${urlUsed}/update/emojis`, options)
    } catch(err){
        console.log(err)
    }
    e.returnValue = "";
}
