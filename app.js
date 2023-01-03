const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Vital2002:Vital2002@cluster0.bzgpnqk.mongodb.net/todolistDB",{useNewUrlParser:true});

const itemsSchema = {
    name:String
};

const Item = mongoose.model('item',itemsSchema);

const item1 = new Item({
    name:"Bread"
});
const item2 = new Item({
    name:"Milk"
});
const item3 = new Item({
    name:"Ghee"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name:String,
    items: [itemsSchema]
}
const List = new mongoose.model("List",listSchema);

app.get("/", function (req, res) {
    var today = new Date();

    var options={
        weekday:"long",
        day:"numeric",
        month:"long"
    }

    let day=today.toLocaleDateString("en-US",options);

    Item.find({},function(err,foundItems){
        if(foundItems.length===0){
            Item.insertMany(defaultItems,function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("succesfully saved the items to database");
                }
            });
            res.redirect("/");
        }
        else{
            res.render("list",{ listTitle: day,  newItems:foundItems});
        }
    });
});

app.get("/:customListName",function(req,res){
    const newListName = _.capitalize(req.params.customListName);

    List.findOne({name:newListName},function(err,foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name : newListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/"+newListName);
            }
            else{
                res.render("list",{ listTitle:foundList.name , newItems:foundList.items})
            }
        }
    })
});

app.post("/",function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name : itemName
    });

    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
    }
})

app.post("/delete",function(req,res){
    const checkedItem = (req.body.checkbox);
    const listName = req.body.listName;

    if(listName =="Today"){
        Item.findByIdAndRemove(checkedItem,function(err){
            if(!err){
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItem}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName)
            }
        })
    }

});

var port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
 
app.listen(port, function() {
  console.log("Server started succesfully");
}); 