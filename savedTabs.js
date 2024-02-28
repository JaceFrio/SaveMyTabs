// regex for hex colors
const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`

let paypalDono = $('.paypalDono')
let saveTabsButton = $('.saveTabsButton')
let savedTabContainer = $('.savedTabContainer')
let colorOneInput = $('.colorOne')
let saveTabsButtonText = $('.saveTabsButtonText')
let whiteFontRadio = $('#whiteFont')
let blackFontRadio = $('#blackFont')
let colorTheme
let bwFontColor

// changes the colors of elements to match user chosen color theme
function setColors(color) {
  colorTheme = color
  $('.colorOneBackground').css({backgroundColor: `${color}`})
  $('.colorOneText').css({color: `${color}`})
  saveTabsButton.css({border: `2px solid ${color}`})
  chrome.storage.sync.set({['color']: color})
}

// regex tester to confirm color input is in hex
colorOneInput.on('change', () => {
  let reg=/^([0-9A-Fa-f]{3}){1,2}$/i;
  if (reg.test(colorOneInput.val())) {
    let color = '#' + colorOneInput.val()
    setColors(color)
    console.log('setting new color')
  }
  else {
    colorOneInput.val(colorTheme.slice(1))
  }
})

// button hover color matches user chosen color theme
saveTabsButton.on('mouseover', async () => { 
  saveTabsButtonText.css({color: `${colorTheme}`})
})

// button color goes back to white
saveTabsButton.on('mouseout', async () => { 
  saveTabsButtonText.css({color: `${bwFontColor}`})
})

paypalDono.on('click', async () => {
  await chrome.tabs.create({ url: "https://www.paypal.com/donate/?business=DGXB256H3GFCG&amount=1&no_recurring=0&currency_code=USD" })
})

function changeFontColor(color) {
  bwFontColor = color
  let pTexts = $('.savedTabContainer > div > div > p')
  let h2Texts = $('.savedTabContainer > div > h2')
  let h3Texts = $('.savedTabContainer > div > h3')
  for (pText of pTexts) {
    pText.style.color = color
  }
  for (h2Text of h2Texts) {
    h2Text.style.color = color
  }
  for (h3Text of h3Texts) {
    h3Text.style.color = color
  }
  saveTabsButtonText.css({color: `${color}`})
}

whiteFontRadio.on('click', async () => {
  changeFontColor('white')
  chrome.storage.sync.set({['fontColor']: 'white'})
})

blackFontRadio.on('click', async () => {
  changeFontColor('black')
  chrome.storage.sync.set({['fontColor']: 'black'})
})

// load all saved tabs and extension color theme
$(document).on('DOMContentLoaded', async () => {
  // dynamically create color option buttons
  for (let i = 1; i < 81; i++) {
    $('.colorOptionContainer').append(`<div class="colorOption colorOption${i}"></div>`)
  }

  // takes the color from the color theme icon and applies it to all elements
  $('.colorOption').on('click', async (e) => {
      let color = rgb2hex($(e.target).css('background-color'))
      colorOneInput.val(color.slice(1))
      setColors(color)
  })

  let groupLocalStorage = await chrome.storage.sync.get(null)
  let storedGroupKeys = Object.keys(groupLocalStorage)
  for (storedGroupKey of storedGroupKeys) {
    if (storedGroupKey !== 'color' && storedGroupKey !== 'fontColor') {
      let storedGroups = groupLocalStorage[storedGroupKey]
      let savedTabsSetHTML = ''
      savedTabsSetHTML += `<div class="${storedGroupKey} colorOneBackground">`
      savedTabsSetHTML += `<h2> ${storedGroups[0]} </h2>`
      let groupNum = 0
      for (storedGroup of storedGroups[1]) {
        if (groupNum == 0) {
          if (storedGroup.length !== 0) {
            savedTabsSetHTML += `<h3> No Group </h3>`
          }
        }
        else {
          if (storedGroup[0].groupName != "") {
            savedTabsSetHTML += `<h3> ${storedGroup[0].groupName} </h3>`
          }
          else {
            savedTabsSetHTML += `<h3> Group </h3>`
          }
        }
        groupNum++
        for (tab of storedGroup) {
          savedTabsSetHTML += `
          <div>
            <p> <b> ${tab.tab.title} </b> <br> ${tab.tab.url} </p>
          </div>
          `
        }
      }
      savedTabsSetHTML += `</div>`
      $('.savedTabContainer').append(savedTabsSetHTML)
    }
  }

  let colorSetting = await chrome.storage.sync.get('color')
  if (colorSetting.color) {
    colorOneInput.val(colorSetting.color.slice(1))
    setColors(colorSetting.color)
  }

  let fontColorOption = await chrome.storage.sync.get('fontColor')
  changeFontColor(fontColorOption.fontColor)
  if (fontColorOption.fontColor == 'white') {
    whiteFontRadio.checked = true
  }
  else if (fontColorOption.fontColor == 'black') {
    blackFontRadio.checked = true
  }
})

// save all tabs in current window to chrome storage
saveTabsButton.on('click', async () => {
  let numSavedTabsSets = 0
  let tabs = await chrome.tabs.query({ currentWindow: true })
  if (tabs.length > 1) {
    let groups = [[]]
    let prevTabGroup = 1
    let currentGroup = 0
    for (tab of tabs) {
      if (tab.groupId == -1) {
        if (tab.url != 'chrome://newtab/') {
          groups[0].push({
            tab: tab, 
            groupName: "No Group"
          })
        }
      }
      else {
        let tabGroupInfo = await chrome.tabGroups.get(tab.groupId)
        let groupTitle = tabGroupInfo.title
        let groupColor = tabGroupInfo.color
        if (prevTabGroup == tab.groupId) {
          groups[currentGroup].push({ 
            tab: tab, 
            groupName: groupTitle,
            groupColor: groupColor
          })
        }
        else {
          prevTabGroup = tab.groupId
          currentGroup++
          groups.push([])
          groups[currentGroup].push({ 
            tab: tab, 
            groupName: groupTitle,
            groupColor: groupColor
          })
        }
      }
    }
    let savedTabsSetHTML = ''
    
    let date = new Date()
    let time = new Date().toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    let timestamp = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${time}`
    let fullTimestamp = `${timestamp} ${date.getSeconds()}`
    savedTabsSetHTML += `<div class="${fullTimestamp} colorOneBackground">`
    savedTabsSetHTML += `<h2> ${timestamp} </h2>`
    let groupNum = 0
    for (group of groups) {
      if (groupNum == 0) {
        if (group.length !== 0) {
          savedTabsSetHTML += `<h3> No Group </h3>`
        }
      }
      else {
        if (group[0].groupName != "") {
          console.log(group[0].groupName)
          savedTabsSetHTML += `<h3> ${group[0].groupName} </h3>`
        }
        else {
          savedTabsSetHTML += `<h3> Group </h3>`
        }
      }
      groupNum++
      for (tab of group) {
        savedTabsSetHTML += `
        <div>
          <p> <b> ${tab.tab.title} </b> <br> ${tab.tab.url} </p>
        </div>
        `
      }
    }
    savedTabsSetHTML += `</div>`
    $('.savedTabContainer').append(savedTabsSetHTML)
    numSavedTabsSets++
    let key = `${fullTimestamp}`
    chrome.storage.sync.set({[key]: [timestamp, groups]})

    let colorSetting = await chrome.storage.sync.get('color')
    if (colorSetting.color) {
      colorOneInput.val(colorSetting.color.slice(1))
      setColors(colorSetting.color)
    }

    chrome.tabs.query({currentWindow: true}, async (tabs) => {
      await chrome.tabs.create({ url: 'chrome://newtab' })
      for (var i = 0; i < tabs.length; i++) {
          chrome.tabs.remove(tabs[i].id)
      }
    })
  }
})

// take saved tabs and load them into the current window with their groups
$(document).on('click', 'body > div.savedTabContainer > div', async (e) => {
  let groupKey = await e.currentTarget.className.slice(0, -19)
  let storedValue = await chrome.storage.sync.get(groupKey)
  let storedGroups = Object.values(storedValue)[0]
  let groupNum = 0
  for (storedGroup of storedGroups[1]) {
    if (groupNum == 0) {
      if (storedGroup.length !== 0) {
        for (tab of storedGroup) {
          await chrome.tabs.create({ url: tab.tab.url })
        }
      }
    }
    else {
      let tabIds = []
      for (tab of storedGroup) {
        let newTab = await chrome.tabs.create({ url: tab.tab.url })
        tabIds.push(newTab.id)
      }
      let newGroup = await chrome.tabs.group({tabIds: tabIds})
      await chrome.tabGroups.update(newGroup, {title: storedGroup[0].groupName, color: storedGroup[0].groupColor})
    }
    groupNum++
  }
  e.currentTarget.remove()
  chrome.storage.sync.remove(groupKey)
  chrome.tabs.query({index: 0}, async (firstTab) => {
    await chrome.tabs.update(firstTab[0].id, {selected: true, highlighted: true, active: true})
  })
})