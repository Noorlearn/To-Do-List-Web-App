//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _=require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1/ToDoListDB');
const Schema = mongoose.Schema;
const itemSchema=new Schema({
  name:String
});
const ListSchema=new Schema({
  name:String,
  items:[itemSchema]
});

const Item=mongoose.model('Item',itemSchema);
const List=mongoose.model('List',ListSchema);

const item1=new Item({
  name:"Welcome to your TodoList!"
});

const item2=new Item({
  name:"Hit the + button to add a new item."
});

const item3=new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems=[item1,item2,item3];


app.get("/", async function(req, res) {
 const foundItems= await Item.find({});

 if(foundItems.length===0){
  await Item.insertMany(defaultItems);
  res.redirect("/");
 }
 else{
  res.render("list", {listTitle: "Today", newListItems: foundItems});
 }
 
// const day = date.getDate();

});
app.use((req, res, next) => {
  if (req.originalUrl === "/favicon.ico") {
    return res.status(204).end(); // Respond with status 204 (No Content)
  }
  next(); // Continue to the next middleware or route
});


app.get("/:customListName",async function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  await List.findOne({name:customListName}).then(async (foundItem)=>{
    if(!foundItem){
      const list=new List({
        name:customListName,
        items:defaultItems
      });
      await list.save();
      res.redirect("/"+customListName);
    }else{
      res.render("list",{listTitle: foundItem.name, newListItems: foundItem.items});
    }
  }).catch((err)=>{
    console.log(err);
  });
});

app.post("/", async function(req, res){

  const itemName= req.body.newItem;
  const listname=req.body.list;

  const item=new Item ({
    name:itemName
  });

  if(listname==="Today"){
    item.save();
    res.redirect("/");
  }else{
    await List.findOne({name:listname}).then((foundItem)=>{
      foundItem.items.push(item);
      foundItem.save();
      res.redirect("/"+ listname);
    }).catch((err)=>{
      console.log(err);
    });
  }
  
});

app.post("/delete", async function(req,res){
  const checkedItemID=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today"){
    await Item.findByIdAndRemove(checkedItemID).then(()=>{
      console.log("Succesfully found and removed the item.");
    }).catch((err)=>{
      console.log(err);
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemID}}}).then(()=>{
      res.redirect("/"+listName);
    }).catch((err)=>{
      console.log(err);
    });
  }
  
});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
