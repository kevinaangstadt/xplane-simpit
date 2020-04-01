const { app, BrowserWindow } = require('electron');
const fs = require('fs');

const ExtPlaneJs = require('extplanejs');
const zerorpc = require("zerorpc");

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  win.loadFile('index.html');

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

var instrument_configs = JSON.parse(fs.readFileSync("datarefs.json"));
var user_configs = JSON.parse(fs.readFileSync("config.json"));

let attach_xplane = () => {
  var ExtPlane = new ExtPlaneJs({
      host: 'bewkes144-02.local',
      port: 51000,
      broadcast: false
  });

  ExtPlane.on('loaded', function(){

  	ExtPlane.client.interval(.03);
    
    // get all of the consumers to subscribe
    simpit.invoke(
      "get_consumers",
      (error, res, more) => {
        if(error) {
          console.error(error);
        } else {
          console.log(res);
          res.forEach(dref => {
            ExtPlane.client.subscribe(dref);
            ExtPlane.on(dref, (data_ref, value)=> {
              simpit.invoke("set_value", data_ref, value, (error,res,more) => {
                if(error) { console.error(error); }
                else { 
                  console.log(data_ref+' - '+value);
                }
              });
            });
          });
        }
        
        if (!more) {
          console.log("Done.");
        }
      }
    );

  });
};

let enable_instruments = () => {
  simpit.invoke("enable_all", (error,res,more) => {
    if(error) {
      console.error(error);
    } else {
      console.log("Enabled all instruments");
      attach_xplane();
    }
  });
};

let connect_instruments = () => {
  simpit.invoke("connect_instruments", (error,res,more) => {
    if(error) {
      console.error(error);
    } else {
      console.log("Connected all instruments");
      enable_instruments();
    }
  });
};

var simpit = new zerorpc.Client();
simpit.connect(user_configs.zerorpc);

user_configs.instruments.forEach(i => {
  console.log(i.address);
  console.log(parseInt(i.address));
  simpit.invoke(
    "add_instrument", 
    i.name, 
    i.type, 
    parseInt(i.address), 
    instrument_configs[i.type].consumers, 
    instrument_configs[i.type].producers, 
    (error, res, more) => {
      if(error) {
        console.error(error);
      } else {
        console.log("Added all instruments.");
        connect_instruments();
      }

      if(!more) {
        console.log("Done.");
      }
    });
});



