import { Web3Storage } from "https://cdn.jsdelivr.net/npm/web3.storage/dist/bundle.esm.min.js";

let tokenInput =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGVFOTE5N0UzZjg4NDVERDZFREI0MjAwMzUyNDkwZGRiNDYwMWI2QjYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzU4Nzc5Mjk5ODgsIm5hbWUiOiJ0ZW1wIn0.3NRcLALJLP1Noh48GThYaHGkL_CMaMysCNxmQ6l-VKY";
const token = tokenInput;

let letterProxy = null
let mtaBridge = null
let yourApplications = [];
let currApp = -1
window.onload = async () => {
    letterProxy = new LetterProxy()
    mtaBridge = new MtaBridge()

    await connect();
    document.getElementById("showAll").onclick = async () => {
        await getAppByInstitute("rcoem");
    }
    document.getElementById("showYour").onclick = async () => {
        startLoad()
        await getYourApplication();
        endLoad()
    }

    document.getElementById("create").addEventListener("click", create);
    document.getElementById("close").onclick = () => {
        document.getElementsByClassName("app-write")[0].style.display = "none"
    }
    document.getElementById("view-close").onclick = () => {
        document.getElementsByClassName("app-view")[0].style.display = "none"
        currApp = -1
    }
    document.getElementById("create-app-nav").onclick = () => {
        document.getElementsByClassName("app-write")[0].style.display = "flex"
    }
    document.getElementById("edit-remark-close").onclick = () => {
        document.getElementsByClassName("edit-write")[0].style.display = "none"
    }

    document.getElementById("edit-remark-btn").onclick = async () => {
        if (currApp == -1) {
            console.log("invalid cert id");
            return
        }
        startLoad()
        let status = document.getElementById("edit-status-input").value;
        let remark = document.getElementById("edit-remark-input").innerText
        let certID = yourApplications[currApp]["id"]
        let res = await letterProxy.updateRemark(certID, status, remark)
        sleep(700)
        endLoad()
        document.getElementsByClassName("edit-write")[0].style.display = "none"
    }
    // // document.getElementById("by-mail-btn").addEventListener("click", getAddressByMail);
    // document.getElementById("by-institute-btn").addEventListener("click", getAppByInstitute);
    // document.getElementById("getFileLink").addEventListener("click", getFileLink)

    let blocks = document.getElementsByClassName("block")
    for (let i = 0; i < blocks.length; ++i) {
        blocks[i].addEventListener("click", () => {
            let temp = document.getElementsByClassName("block")
            for (let j = 0; j < temp.length; ++j) {
                temp[j].style.borderBottomColor = "white"
            }
            temp[i].style.borderBottomColor = "#3671e9"
        })
    }
    blocks[0].click()
}
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const connect = async () => {
    if (letterProxy == null) return;
    startLoad()
    await letterProxy.connect()
    console.log("on connect: account details");
    console.log(letterProxy.account);

    await mtaBridge.connect(letterProxy)
    await sleep(400)
    endLoad()
}

const create = async () => {
    // name, subject, description, recipients, institute, fileLink
    if (letterProxy == null) return;
    startLoad()
    let name = document.getElementById("name-input").value;
    let subject = document.getElementById("subject-input").value;
    let description = document.getElementById("description-input").innerText;
    let recipients = document.getElementById("recipients-input").value;
    recipients = recipients.split(",")
    let tempRecp = []
    for (let i = 0; i < recipients.length; ++i) {
        tempRecp.push(await mtaBridge.getRecordByMail(recipients[i]))
    }
    console.log(tempRecp);
    recipients = tempRecp
    let institute = document.getElementById("institute-input").value;
    let fileLink = await getFileLink();

    console.log(name);
    console.log(subject);
    console.log(description);
    console.log(recipients);
    console.log(institute);
    console.log(fileLink);
    let res = await letterProxy.createApplication(name, subject, description, recipients, institute, fileLink);
    console.log("application created: ");
    document.getElementsByClassName("app-write")[0].style.display = "none"
    endLoad()
}

const getAppByInstitute = async (institute) => {
    if (letterProxy == null) return;
    startLoad()
    // let institute = document.getElementById("by-institute-input").value;
    let res = await letterProxy.getApplicationByInstitute(institute);
    console.log(`get application by institute: ${institute} `);
    console.log(res);
    await sleep(200)
    endLoad()

    yourApplications = []
    let certIDS = []
    for (let i = res.length - 1; i >= 0; --i) {
        res[i]["edit"] = 0;
        if (certIDS.indexOf(res[i]["id"]) == -1) {
            yourApplications.push(res[i])
            certIDS.push(res[i]["id"])
        }
    }
    buildCards(yourApplications)
}

const getYourApplication = async () => {
    if (letterProxy == null) return;
    let res = await letterProxy.getApplicationByAddress()
    console.log(res);
    yourApplications = []
    for (let i = 0; i < res.length; ++i) {
        // console.log(res[i]);
        let temp = await letterProxy.getApplicationByID(res[i]);
        console.log(temp);

        let data = {}
        data["id"] = temp[0];
        data["name"] = temp[1];
        data["subject"] = temp[2];
        data["description"] = temp[3];
        data["file"] = temp[4];
        data["applierAddress"] = temp[5];
        data["recipients"] = temp[6];
        data["institute"] = temp[7];
        data["states"] = temp[8];
        data["remarks"] = temp[9];
        data["edit"] = 1;
        yourApplications.push(data)
    }
    buildCards(yourApplications)
}
const getAddressFromMail = async (mail) => {
    if (mtaBridge == null) {
        console.log("mta bridge is down !!");
        return;
    }
    let res = await mtaBridge.getRecordByMail(mail);
    console.log(res);
}

const getFileLink = async () => {
    let client = new Web3Storage({ token });
    let files = document.getElementById("filepicker").files;
    console.log("file uploading");
    let cid = await client.put(files, {
        onRootCidReady: (localCid) => {
            console.log(`> ???? locally calculated Content ID: ${localCid} `);
            console.log("> ???? sending files to web3.storage ");
        },
        onStoredChunk: (bytes) =>
            console.log(`> ???? sent ${bytes.toLocaleString()} bytes to web3.storage`),
    });
    let link = `https://dweb.link/ipfs/${cid}`
    console.log(link);
    return link
}

const buildCards = (data) => {
    let appContainer = document.getElementsByClassName("applications")[0]
    let txt = ""
    for (let i = 0; i < data.length; ++i) {
        txt += `
        <div class="application">
            <div class="subject">
            ${data[i]["subject"]}
            </div>
            <div class="name">
            ${data[i]["name"]}
            </div>
            <div class="description">
            ${data[i]["description"]}
            </div>
        </div>
        `
    }
    appContainer.innerHTML = txt
    attachEvent(yourApplications)
}
const attachEvent = (yourApplications) => {
    let apps = document.getElementsByClassName("application")
    for (let i = 0; i < apps.length; ++i) {
        apps[i].addEventListener("click", () => {
            document.getElementsByClassName("app-view")[0].style.display = "flex"

            fillView(i)
            currApp = i;
        })
    }
}
const fillView = async (i) => {
    document.getElementById("name-out").innerText = yourApplications[i]["name"]
    document.getElementById("subject-out").innerText = yourApplications[i]["subject"]
    document.getElementById("description-out").innerText = yourApplications[i]["description"]

    let tempMail = []
    for (let j = 0; j < yourApplications[i]["recipients"].length; ++j) {
        tempMail[j] = await mtaBridge.getRecordByAddress(yourApplications[i]["recipients"][j])
    }
    document.getElementById("recipients-out").innerText = tempMail

    document.getElementById("institute-out").innerText = yourApplications[i]["institute"]

    document.getElementById("file-out").href = yourApplications[i]["file"]

    let remarks = document.getElementsByClassName("remarks")[0]
    console.log(yourApplications[i]["recipients"]);
    let arr = yourApplications[i]["recipients"]
    let temp = ""
    for (let j = 0; j < arr.length; ++j) {
        let col = (yourApplications[i]["states"][j] == "0") ? "tomato" : "lightGreen"
        let currMail = yourApplications[i]["recipients"][j] == letterProxy.account.address

        let dis = (yourApplications[i]["edit"] == 1 && currMail) ? "flex" : "none"
        temp += `<div class="remark" style="border-left-color:${col}">
            <div class="status">ID: ${tempMail[j]}</div>
            <label for="">Remark:</label>
            <div class="status">${yourApplications[i]["remarks"][j]}</div>
            <button class="edit-btn" style="display:${dis};">edit</button>
        </div>`
    }
    remarks.innerHTML = temp
    let editBtns = document.getElementsByClassName("edit-btn")
    for (let j = 0; j < editBtns.length; ++j) {
        editBtns[j].onclick = () => {
            document.getElementsByClassName("edit-write")[0].style.display = "flex"
        }
    }

}