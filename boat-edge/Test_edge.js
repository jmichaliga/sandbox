/**
 * Adobe Helium: symbol definitions
 */
window.symbols = {
"stage": {
   version: "0.1",
   baseState: "Base State",
   initialState: "Base State",
   parameters: {

   },
   content: {
      dom: [
        {
            id:'bg',
            type:'image',
            rect:[0,0,1224,1584],
            fill:['rgba(0,0,0,0)','images/bg1.png'],
        },
        {
            id:'cloud5',
            type:'image',
            rect:[0,0,231,91],
            fill:['rgba(0,0,0,0)','images/cloud4.png'],
        },
        {
            id:'cloud3',
            type:'image',
            rect:[0,0,230,90],
            fill:['rgba(0,0,0,0)','images/cloud11.png'],
        },
        {
            id:'backwave',
            type:'image',
            rect:[0,0,4165,76],
            fill:['rgba(0,0,0,0)','images/wavestop.png'],
        },
        {
            id:'boat',
            type:'image',
            rect:[0,0,161.07250668474,215.08484425567],
            fill:['rgba(0,0,0,0)','images/boat3.png'],
        },
        {
            id:'dolphin',
            type:'image',
            rect:[0,0,52.083325514826,39.544747150146],
            fill:['rgba(0,0,0,0)','images/dolphin1.png'],
        },
        {
            id:'frontwave',
            type:'image',
            rect:[0,0,4165,58],
            fill:['rgba(0,0,0,0)','images/wavebottom1.png'],
        },
        {
            id:'cloud6',
            type:'image',
            rect:[0,0,229.999985377,89.999994277955],
            fill:['rgba(0,0,0,0)','images/cloud10.png'],
        },
        {
            id:'cloud4',
            type:'image',
            rect:[0,0,231,91],
            fill:['rgba(0,0,0,0)','images/cloud6.png'],
        },
        {
            id:'cloud2',
            type:'image',
            rect:[0,0,230,90],
            fill:['rgba(0,0,0,0)','images/cloud12.png'],
        },
        {
            id:'cloud',
            type:'image',
            rect:[0,0,230,90],
            fill:['rgba(0,0,0,0)','images/cloud13.png'],
        },
        {
            id:'Image5',
            type:'image',
            rect:[0,0,192.90120561047,161.07250668474],
            fill:['rgba(0,0,0,0)','images/woosh.png'],
        },
        {
            id:'woosh1',
            type:'image',
            rect:[0,0,63.657397851455,53.047831542879],
            fill:['rgba(0,0,0,0)','images/woosh4.png'],
        },
        {
            id:'blue',
            type:'rect',
            rect:[-8.9645060300827,389.37649536133,584.49062907696,90.66357421875],
            fill:['rgba(192,192,192,1)'],
            stroke:[0,"rgba(0,0,0,1)","none"],
        },
        {
            id:'Image12',
            type:'image',
            rect:[0,0,446.88780395912,158.33974348911],
            fill:['rgba(0,0,0,0)','images/EdgeWording.png'],
        },
      ],
      symbolInstances: [
      ],
   },
   states: {
      "Base State": {
         "#Image12": [
            ["transform", "translateX", '44.2065px'],
            ["transform", "translateY", '390.625px']
         ],
         "#Image5": [
            ["transform", "translateX", '19.2901px'],
            ["transform", "scaleX", '0.51'],
            ["style", "opacity", '0'],
            ["transform", "translateY", '195.795px'],
            ["transform", "scaleY", '0.51']
         ],
         "#cloud5": [
            ["transform", "translateX", '-96px'],
            ["transform", "translateY", '88px']
         ],
         "#dolphin": [
            ["transform", "translateX", '75.2314px'],
            ["transform", "rotateZ", '-103deg'],
            ["transform", "translateY", '380.98px']
         ],
         "#cloud6": [
            ["transform", "scaleX", '0.54'],
            ["transform", "translateY", '95px'],
            ["transform", "scaleY", '0.54'],
            ["transform", "translateX", '-65px']
         ],
         "#blue": [
            ["color", "background-color", 'rgba(46,164,213,1.00)'],
            ["color", "border-color", 'transparent'],
            ["transform", "translateY", '5.78701px'],
            ["style", "height", '577.739px']
         ],
         "#woosh1": [
            ["transform", "translateX", '-54.0123px'],
            ["style", "opacity", '0'],
            ["transform", "translateY", '253.665px']
         ],
         "#cloud2": [
            ["transform", "translateX", '-248px'],
            ["transform", "translateY", '86px']
         ],
         "#stage": [
            ["color", "background-color", 'rgba(255,255,255,1)'],
            ["style", "overflow", 'hidden'],
            ["style", "height", '400px'],
            ["style", "width", '550px']
         ],
         "#cloud": [
            ["transform", "scaleX", '0.68'],
            ["transform", "translateY", '32px'],
            ["transform", "scaleY", '0.68'],
            ["transform", "translateX", '-238px']
         ],
         "#cloud4": [
            ["transform", "scaleX", '1.33'],
            ["transform", "translateX", '-13px'],
            ["transform", "scaleY", '1.33'],
            ["transform", "translateY", '17px']
         ],
         "#cloud3": [
            ["transform", "scaleX", '0.72'],
            ["transform", "scaleY", '0.72'],
            ["transform", "translateY", '42px'],
            ["transform", "translateX", '-232px']
         ],
         "#backwave": [
            ["transform", "translateY", '324px'],
            ["transform", "translateX", '-3612px']
         ],
         "#boat": [
            ["transform", "translateX", '-164.931px'],
            ["transform", "rotateZ", '8deg'],
            ["transform", "translateY", '174.576px']
         ],
         "#frontwave": [
            ["transform", "translateX", '-10px'],
            ["transform", "translateY", '342px']
         ],
         "#bg": [
            ["transform", "translateX", '-237px'],
            ["transform", "rotateZ", '-19deg'],
            ["transform", "scaleX", '0.97'],
            ["transform", "translateY", '-705px'],
            ["transform", "scaleY", '0.97']
         ]
      }
   },
   actions: {

   },
   bindings: [

   ],
   timelines: {
      "Default Timeline": {
         fromState: "Base State",
         toState: "",
         duration: 118500,
         timeline: [
            { id: "eid93", tween: [ "transform", "#cloud4", "scaleY", '1.33', { valueTemplate: undefined, fromValue: '1.33'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid286", tween: [ "transform", "#dolphin", "translateX", '127.796px', { valueTemplate: undefined, fromValue: '75.2314px'}], position: 1250, duration: 1000, easing: "linear" },
            { id: "eid295", tween: [ "transform", "#dolphin", "translateX", '211.226px', { valueTemplate: undefined, fromValue: '127.796px'}], position: 2250, duration: 1000, easing: "linear" },
            { id: "eid139", tween: [ "transform", "#cloud", "scaleX", '0.68', { valueTemplate: undefined, fromValue: '0.68'}], position: 32000, duration: 0, easing: "linear" },
            { id: "eid130", tween: [ "transform", "#cloud3", "translateX", '1182px', { valueTemplate: undefined, fromValue: '-232px'}], position: 7750, duration: 55000, easing: "linear" },
            { id: "eid120", tween: [ "transform", "#cloud6", "translateX", '883.33px', { valueTemplate: undefined, fromValue: '-65px'}], position: 0, duration: 32000, easing: "linear" },
            { id: "eid253", tween: [ "style", "#woosh1", "opacity", '0.464706', { valueTemplate: undefined, fromValue: '0'}], position: 4321, duration: 678, easing: "easeInOutQuad" },
            { id: "eid251", tween: [ "style", "#woosh1", "opacity", '0', { valueTemplate: undefined, fromValue: '0.46470588235294'}], position: 5000, duration: 750, easing: "easeInOutQuad" },
            { id: "eid258", tween: [ "style", "#woosh1", "opacity", '0.68823529411765', { valueTemplate: undefined, fromValue: '0'}], position: 10250, duration: 813, easing: "linear" },
            { id: "eid259", tween: [ "style", "#woosh1", "opacity", '0', { valueTemplate: undefined, fromValue: '0.688235'}], position: 11063, duration: 686, easing: "linear" },
            { id: "eid266", tween: [ "style", "#woosh1", "opacity", '0.51176470588235', { valueTemplate: undefined, fromValue: '0'}], position: 15000, duration: 904, easing: "linear" },
            { id: "eid265", tween: [ "style", "#woosh1", "opacity", '0', { valueTemplate: undefined, fromValue: '0.511765'}], position: 15904, duration: 1095, easing: "linear" },
            { id: "eid470", tween: [ "transform", "#boat", "translateY", '170.496px', { valueTemplate: undefined, fromValue: '174.576px'}], position: 20750, duration: 340, easing: "linear" },
            { id: "eid503", tween: [ "transform", "#boat", "translateY", '-80.5504px', { valueTemplate: undefined, fromValue: '170.496px'}], position: 21090, duration: 409, easing: "linear" },
            { id: "eid502", tween: [ "transform", "#boat", "translateY", '-224.122px', { valueTemplate: undefined, fromValue: '-80.5504px'}], position: 21500, duration: 250, easing: "linear" },
            { id: "eid505", tween: [ "transform", "#boat", "translateY", '-287.333px', { valueTemplate: undefined, fromValue: '-224.122px'}], position: 21750, duration: 177, easing: "linear" },
            { id: "eid504", tween: [ "transform", "#boat", "translateY", '162.037px', { valueTemplate: undefined, fromValue: '-287.333px'}], position: 21927, duration: 26822, easing: "linear" },
            { id: "eid131", tween: [ "transform", "#cloud2", "translateY", '86px', { valueTemplate: undefined, fromValue: '86px'}], position: 23500, duration: 0, easing: "linear" },
            { id: "eid61", tween: [ "transform", "#bg", "rotateZ", '358deg', { valueTemplate: undefined, fromValue: '-19deg'}], position: 0, duration: 118500, easing: "linear" },
            { id: "eid92", tween: [ "transform", "#cloud4", "scaleX", '1.33', { valueTemplate: undefined, fromValue: '1.33'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid248", tween: [ "transform", "#woosh1", "translateX", '-13.503px', { valueTemplate: undefined, fromValue: '-54.0123px'}], position: 4321, duration: 1428, easing: "easeInOutQuad" },
            { id: "eid254", tween: [ "transform", "#woosh1", "translateX", '45.3319px', { valueTemplate: undefined, fromValue: '-13.503px'}], position: 5750, duration: 4500, easing: "linear" },
            { id: "eid257", tween: [ "transform", "#woosh1", "translateX", '81.0186px', { valueTemplate: undefined, fromValue: '45.3319px'}], position: 10250, duration: 1500, easing: "linear" },
            { id: "eid261", tween: [ "transform", "#woosh1", "translateX", '110.918px', { valueTemplate: undefined, fromValue: '81.0186px'}], position: 11750, duration: 3250, easing: "linear" },
            { id: "eid263", tween: [ "transform", "#woosh1", "translateX", '172.646px', { valueTemplate: undefined, fromValue: '110.918px'}], position: 15000, duration: 2000, easing: "linear" },
            { id: "eid509", tween: [ "transform", "#Image12", "translateX", '44.2065px', { valueTemplate: undefined, fromValue: '44.2065px'}], position: 21169, duration: 0, easing: "easeOutQuad" },
            { id: "eid511", tween: [ "transform", "#Image12", "translateY", '128.601px', { valueTemplate: undefined, fromValue: '390.625px'}], position: 21169, duration: 758, easing: "easeOutQuad" },
            { id: "eid483", tween: [ "color", "#blue", "border-color", 'transparent', { animationColorSpace: 'RGB', valueTemplate: undefined, fromValue: 'transparent'}], position: 20750, duration: 0, easing: "linear" },
            { id: "eid91", tween: [ "transform", "#cloud4", "translateY", '17px', { valueTemplate: undefined, fromValue: '17px'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid287", tween: [ "transform", "#dolphin", "translateY", '339.989px', { valueTemplate: undefined, fromValue: '380.98px'}], position: 1250, duration: 1000, easing: "linear" },
            { id: "eid296", tween: [ "transform", "#dolphin", "translateY", '376.158px', { valueTemplate: undefined, fromValue: '339.989px'}], position: 2250, duration: 1000, easing: "linear" },
            { id: "eid116", tween: [ "transform", "#cloud6", "scaleX", '0.54', { valueTemplate: undefined, fromValue: '0.54'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid184", tween: [ "transform", "#boat", "translateX", '-0.75966px', { valueTemplate: undefined, fromValue: '-164.931px'}], position: 0, duration: 11063, easing: "linear" },
            { id: "eid192", tween: [ "transform", "#boat", "translateX", '71.06529px', { valueTemplate: undefined, fromValue: '-0.75966px'}], position: 11063, duration: 4840, easing: "linear" },
            { id: "eid194", tween: [ "transform", "#boat", "translateX", '558.449px', { valueTemplate: undefined, fromValue: '71.06529px'}], position: 15904, duration: 32845, easing: "linear" },
            { id: "eid492", tween: [ "transform", "#blue", "translateY", '5.34739px', { valueTemplate: undefined, fromValue: '2.89378px'}], position: 20750, duration: 156, easing: "linear" },
            { id: "eid497", tween: [ "transform", "#blue", "translateY", '1.86018px', { valueTemplate: undefined, fromValue: '5.34739px'}], position: 20906, duration: 93, easing: "linear" },
            { id: "eid498", tween: [ "transform", "#blue", "translateY", '0.60528px', { valueTemplate: undefined, fromValue: '1.86018px'}], position: 21000, duration: 90, easing: "linear" },
            { id: "eid500", tween: [ "transform", "#blue", "translateY", '-41.0437px', { valueTemplate: undefined, fromValue: '0.60528px'}], position: 21090, duration: 78, easing: "linear" },
            { id: "eid499", tween: [ "transform", "#blue", "translateY", '-86.5641px', { valueTemplate: undefined, fromValue: '-41.0437px'}], position: 21169, duration: 80, easing: "linear" },
            { id: "eid496", tween: [ "transform", "#blue", "translateY", '-373.746px', { valueTemplate: undefined, fromValue: '-86.5641px'}], position: 21250, duration: 500, easing: "linear" },
            { id: "eid506", tween: [ "transform", "#blue", "translateY", '-394.644px', { valueTemplate: undefined, fromValue: '-373.746px'}], position: 21750, duration: 177, easing: "linear" },
            { id: "eid16", tween: [ "transform", "#backwave", "translateX", '-5px', { valueTemplate: undefined, fromValue: '-3612px'}], position: 0, duration: 118500, easing: "linear" },
            { id: "eid32", tween: [ "transform", "#frontwave", "translateY", '341.466px', { valueTemplate: undefined, fromValue: '342px'}], position: 0, duration: 21090, easing: "linear" },
            { id: "eid480", tween: [ "transform", "#frontwave", "translateY", '-54.963px', { valueTemplate: undefined, fromValue: '341.466px'}], position: 21090, duration: 659, easing: "linear" },
            { id: "eid481", tween: [ "transform", "#frontwave", "translateY", '339px', { valueTemplate: undefined, fromValue: '-54.963px'}], position: 21750, duration: 96750, easing: "linear" },
            { id: "eid97", tween: [ "transform", "#cloud4", "translateX", '597px', { valueTemplate: undefined, fromValue: '-13px'}], position: 0, duration: 13250, easing: "linear" },
            { id: "eid55", tween: [ "transform", "#bg", "scaleX", '0.97', { valueTemplate: undefined, fromValue: '0.97'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid126", tween: [ "transform", "#cloud3", "translateY", '42px', { valueTemplate: undefined, fromValue: '42px'}], position: 62750, duration: 0, easing: "linear" },
            { id: "eid29", tween: [ "transform", "#frontwave", "translateX", '-651.79px', { valueTemplate: undefined, fromValue: '-10px'}], position: 0, duration: 21090, easing: "linear" },
            { id: "eid479", tween: [ "transform", "#frontwave", "translateX", '-3616px', { valueTemplate: undefined, fromValue: '-651.79px'}], position: 21090, duration: 97409, easing: "linear" },
            { id: "eid482", tween: [ "color", "#blue", "background-color", 'rgba(46,164,213,1.00)', { animationColorSpace: 'RGB', valueTemplate: undefined, fromValue: 'rgba(46,164,213,1.00)'}], position: 20750, duration: 0, easing: "linear" },
            { id: "eid247", tween: [ "transform", "#woosh1", "translateY", '253.665px', { valueTemplate: undefined, fromValue: '253.665px'}], position: 4321, duration: 0, easing: "easeInOutQuad" },
            { id: "eid260", tween: [ "transform", "#woosh1", "translateY", '270.062px', { valueTemplate: undefined, fromValue: '253.665px'}], position: 5750, duration: 4500, easing: "linear" },
            { id: "eid262", tween: [ "transform", "#woosh1", "translateY", '227.624px', { valueTemplate: undefined, fromValue: '270.062px'}], position: 11750, duration: 3250, easing: "linear" },
            { id: "eid58", tween: [ "transform", "#bg", "translateY", '-705px', { valueTemplate: undefined, fromValue: '-705px'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid127", tween: [ "transform", "#cloud3", "scaleX", '0.72', { valueTemplate: undefined, fromValue: '0.72'}], position: 62750, duration: 0, easing: "linear" },
            { id: "eid144", tween: [ "transform", "#cloud", "translateY", '32px', { valueTemplate: undefined, fromValue: '32px'}], position: 81000, duration: 0, easing: "linear" },
            { id: "eid57", tween: [ "transform", "#bg", "translateX", '-237px', { valueTemplate: undefined, fromValue: '-237px'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid4", tween: [ "transform", "#backwave", "translateY", '324px', { valueTemplate: undefined, fromValue: '324px'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid473", tween: [ "transform", "#backwave", "translateY", '-58.9089px', { valueTemplate: undefined, fromValue: '324px'}], position: 21090, duration: 659, easing: "linear" },
            { id: "eid140", tween: [ "transform", "#cloud", "scaleY", '0.68', { valueTemplate: undefined, fromValue: '0.68'}], position: 32000, duration: 0, easing: "linear" },
            { id: "eid82", tween: [ "transform", "#cloud5", "translateY", '88px', { valueTemplate: undefined, fromValue: '88px'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid119", tween: [ "transform", "#cloud6", "translateY", '95px', { valueTemplate: undefined, fromValue: '95px'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid488", tween: [ "style", "#blue", "height", '577.739px', { valueTemplate: undefined, fromValue: '577.739px'}], position: 20750, duration: 0, easing: "linear" },
            { id: "eid191", tween: [ "transform", "#boat", "rotateZ", '-8deg', { valueTemplate: undefined, fromValue: '8deg'}], position: 1728, duration: 2593, easing: "linear" },
            { id: "eid193", tween: [ "transform", "#boat", "rotateZ", '1deg', { valueTemplate: undefined, fromValue: '-8deg'}], position: 4321, duration: 3457, easing: "linear" },
            { id: "eid195", tween: [ "transform", "#boat", "rotateZ", '-8deg', { valueTemplate: undefined, fromValue: '1deg'}], position: 7779, duration: 3457, easing: "linear" },
            { id: "eid196", tween: [ "transform", "#boat", "rotateZ", '-20deg', { valueTemplate: undefined, fromValue: '-8deg'}], position: 11236, duration: 2938, easing: "linear" },
            { id: "eid197", tween: [ "transform", "#boat", "rotateZ", '2deg', { valueTemplate: undefined, fromValue: '-20deg'}], position: 14175, duration: 3457, easing: "linear" },
            { id: "eid198", tween: [ "transform", "#boat", "rotateZ", '-15deg', { valueTemplate: undefined, fromValue: '2deg'}], position: 17632, duration: 3457, easing: "linear" },
            { id: "eid199", tween: [ "transform", "#boat", "rotateZ", '4deg', { valueTemplate: undefined, fromValue: '-15deg'}], position: 21090, duration: 2938, easing: "linear" },
            { id: "eid200", tween: [ "transform", "#boat", "rotateZ", '-17deg', { valueTemplate: undefined, fromValue: '4deg'}], position: 24029, duration: 3284, easing: "linear" },
            { id: "eid201", tween: [ "transform", "#boat", "rotateZ", '-7deg', { valueTemplate: undefined, fromValue: '-17deg'}], position: 27313, duration: 3284, easing: "linear" },
            { id: "eid202", tween: [ "transform", "#boat", "rotateZ", '-25deg', { valueTemplate: undefined, fromValue: '-7deg'}], position: 30598, duration: 3976, easing: "linear" },
            { id: "eid203", tween: [ "transform", "#boat", "rotateZ", '3deg', { valueTemplate: undefined, fromValue: '-25deg'}], position: 34574, duration: 3284, easing: "linear" },
            { id: "eid204", tween: [ "transform", "#boat", "rotateZ", '-23deg', { valueTemplate: undefined, fromValue: '3deg'}], position: 37859, duration: 2593, easing: "linear" },
            { id: "eid205", tween: [ "transform", "#boat", "rotateZ", '0deg', { valueTemplate: undefined, fromValue: '-23deg'}], position: 40452, duration: 1901, easing: "linear" },
            { id: "eid84", tween: [ "transform", "#cloud5", "translateX", '576px', { valueTemplate: undefined, fromValue: '-96px'}], position: 0, duration: 32000, easing: "linear" },
            { id: "eid146", tween: [ "transform", "#cloud", "translateX", '534px', { valueTemplate: undefined, fromValue: '-238px'}], position: 32000, duration: 49000, easing: "linear" },
            { id: "eid128", tween: [ "transform", "#cloud3", "scaleY", '0.72', { valueTemplate: undefined, fromValue: '0.72'}], position: 62750, duration: 0, easing: "linear" },
            { id: "eid138", tween: [ "transform", "#cloud2", "translateX", '550px', { valueTemplate: undefined, fromValue: '-248px'}], position: 23500, duration: 77000, easing: "linear" },
            { id: "eid288", tween: [ "transform", "#dolphin", "rotateZ", '13deg', { valueTemplate: undefined, fromValue: '-103deg'}], position: 1250, duration: 1000, easing: "linear" },
            { id: "eid297", tween: [ "transform", "#dolphin", "rotateZ", '107deg', { valueTemplate: undefined, fromValue: '13deg'}], position: 2250, duration: 1000, easing: "linear" },
            { id: "eid56", tween: [ "transform", "#bg", "scaleY", '0.97', { valueTemplate: undefined, fromValue: '0.97'}], position: 0, duration: 0, easing: "linear" },
            { id: "eid117", tween: [ "transform", "#cloud6", "scaleY", '0.54', { valueTemplate: undefined, fromValue: '0.54'}], position: 0, duration: 0, easing: "linear" }]
      }
   },
}};

/**
 * Adobe Edge DOM Ready Event Handler
 */
$(window).ready(function() {
     $.Edge.initialize(symbols);
});
/**
 * Adobe Edge Timeline Launch
 */
$(window).load(function() {
    $.Edge.play();
});
