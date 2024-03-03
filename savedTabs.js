const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
const hex2rgb = (hex) => hex.match(/[A-Za-z0-9]{2}/g).map((v) => parseInt(v, 16))

// frequently used elements
let saveTabsButton = $('.saveTabsButton')
let colorOneInput = $('.colorOne')
let saveTabsButtonText = $('.saveTabsButtonText')

// color setting variables
let colorTheme
let colorThemeWithOpacity
let fontColor
let currentCustomizationOption = 'background'
let btnOnStyle = {
  backgroundColor: 'white',
  color: 'black',
  cursor: 'pointer'
}
let btnOffStyle = {
  backgroundColor: 'black',
  color: 'white',
  cursor: 'default'
}

function setThemeColorOpacity(rgbArr) {
  let opacity = 0.2
  let rgba = `rgba(${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}, ${opacity})`
  return rgba
}

function updateBtnStyle() {
  if (currentCustomizationOption == 'background') {
    $('.backgroundBtn').css(btnOffStyle)
    $('.fontBtn').css(btnOnStyle)
  }
  if (currentCustomizationOption == 'font') {
    $('.backgroundBtn').css(btnOnStyle)
    $('.fontBtn').css(btnOffStyle)
  }
}

// changes the colors of elements to match user chosen color theme
function setColors(color) {
  colorTheme = color
  colorThemeWithOpacity = setThemeColorOpacity(hex2rgb(colorTheme))
  $('.colorOneBackground').css({backgroundColor: `${color}`})
  $('.colorOneText').css({color: `${color}`})
  btnOnStyle.backgroundColor = colorThemeWithOpacity
  btnOnStyle.color = colorTheme
  btnOffStyle.backgroundColor = colorTheme
  updateBtnStyle()
  saveTabsButton.css({border: `2px solid ${color}`})
  chrome.storage.sync.set({['color']: color})
}

// toggle current color customization setting to background color
$('.backgroundBtn').on('click', () => {
  currentCustomizationOption = 'background'
  updateBtnStyle()
  colorOneInput.val(colorTheme.slice(1))
  $('.selectedColor').css({backgroundColor: `${colorTheme}`})
})

// toggle current color customization setting to font color
$('.fontBtn').on('click', () => {
  currentCustomizationOption = 'font'
  updateBtnStyle()
  colorOneInput.val(fontColor.slice(1))
  $('.selectedColor').css({backgroundColor: `${fontColor}`})
})

// regex tester to confirm color input is in hex
colorOneInput.on('change', () => {
  let reg=/^([0-9A-Fa-f]{3}){1,2}$/i;
  if (reg.test(colorOneInput.val())) {
    let color = '#' + colorOneInput.val()
    $('.selectedColor').css({backgroundColor: `${color}`})
    if (currentCustomizationOption == 'background') {
      setColors(color)
    }
    if (currentCustomizationOption == 'font') {
      changeFontColor(color)
    }
  }
  else {
    if (currentCustomizationOption = 'background') {
      colorOneInput.val(colorTheme.slice(1))
    }
    if (currentCustomizationOption = 'font') {
      colorOneInput.val(fontColor.slice(1))
    }
  }
})

// button hover color matches user chosen color theme
saveTabsButton.on('mouseover', async () => { 
  saveTabsButtonText.css({color: `${colorTheme}`})
})

// save tabs btn color goes to user chosen font color
saveTabsButton.on('mouseout', async () => { 
  saveTabsButtonText.css({color: `${fontColor}`})
})

// open link to paypal donation
$('.paypalDono').on('click', async () => {
  await chrome.tabs.create({ url: "https://www.paypal.com/donate/?business=DGXB256H3GFCG&amount=1&no_recurring=0&currency_code=USD" })
})

// set the font color
function changeFontColor(color) {
  fontColor = color
  $('.savedTabContainer > div > div > p').css({color: `${color}`})
  $('body > div.savedTabContainer > div > div > div > p').css({color: `${color}`})
  $('.savedTabContainer > div > h2').css({color: `${color}`})
  $('.savedTabContainer > div > h3').css({color: `${color}`})
  btnOffStyle.color = fontColor
  updateBtnStyle()
  saveTabsButtonText.css({color: `${color}`})
  chrome.storage.sync.set({['fontColor']: `${color}`})
}

// load all saved tabs and extension color theme
$(document).on('DOMContentLoaded', async () => {
  // set customization button styles
  $('.backgroundBtn').css(btnOffStyle)
  $('.fontBtn').css(btnOnStyle)
  // dynamically create color option buttons
  for (let i = 1; i < 81; i++) {
    $('.colorOptionContainer').append(`<div class="colorOption colorOption${i}"></div>`)
  }

  // takes the color from the color theme icon and applies it to all elements
  $('.colorOption').on('click', async (e) => {
      let color = rgb2hex($(e.target).css('background-color'))
      colorOneInput.val(color.slice(1))
      $('.selectedColor').css({backgroundColor: `${color}`})
      if (currentCustomizationOption == 'background') {
        setColors(color)
      }
      if (currentCustomizationOption == 'font') {
        changeFontColor(color)
      }
  })

  // create user's saved tab group containers
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
            savedTabsSetHTML += `<h3> - No Group </h3>`
          }
        }
        else {
          if (storedGroup[0].groupName != "") {
            savedTabsSetHTML += `<h3> - ${storedGroup[0].groupName} </h3>`
          }
          else {
            savedTabsSetHTML += `<h3> - Group </h3>`
          }
        }
        if (storedGroup.length !== 0) {
          savedTabsSetHTML += '<div class="groupedTabs">'
        }
        groupNum++
        for (tab of storedGroup) {
          savedTabsSetHTML += `
          <div>
            <p> <b> ${tab.tab.title} </b> <br> ${tab.tab.url} </p>
          </div>
          `
        }
        if (storedGroup.length !== 0) {
          savedTabsSetHTML += '</div>'
        }
      }
      savedTabsSetHTML += `</div>`
      $('.savedTabContainer').append(savedTabsSetHTML)
    }
  }

  // apply user's saved color settings
  let colorSetting = await chrome.storage.sync.get('color')
  if (colorSetting.color) {
    colorOneInput.val(colorSetting.color.slice(1))
    $('.selectedColor').css({backgroundColor: `${colorSetting.color}`})
    setColors(colorSetting.color)
  }
  let fontColorOption = await chrome.storage.sync.get('fontColor')
  changeFontColor(fontColorOption.fontColor)
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
    
    // TODO: update to the easier way to do this
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

