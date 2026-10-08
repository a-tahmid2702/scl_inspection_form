/* Place your JavaScript in this file */


function myfunc(){
var infnum= document.getElementById("infnum");
var testnum= document.getElementById("testnum");
if(infnum.value == 0 || testnum.value == 0){alert("শিক্ষার্থীর তথ্য ও যাচাই সংখ্যা দিন");}
else{
for (let i=1; i<=infnum.value; i++){
    var stinf= document.getElementById("stinf");
    var stinfin= document.createElement("input");
    stinf.appendChild(stinfin);
    stinfin.setAttribute('type', 'text');
    document.getElementById("stinf").innerHTML+= "";
}
for (let i=1; i<=testnum.value; i++){
    var testinf= document.getElementById("testinf");
    var testinfin= document.createElement("input");
    testinf.appendChild(testinfin);
    testinfin.setAttribute('type', 'text');
    document.getElementById("testinf").innerHTML+= "";
}
document.getElementById("inpcreator").style.visibility = "hidden";
}
}