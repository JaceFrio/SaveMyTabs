const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
let saveTabsButton = document.getElementsByClassName('saveTabsButton')
let savedTabContainer = document.getElementsByClassName('.savedTabContainer')
let colorOneInput = document.querySelector('.colorOne')
let saveTabsButtonText = document.querySelector('.saveTabsButtonText')
let colorOption = document.querySelectorAll('.colorOption')
let colorTheme

function setColors(color) {
  colorTheme = color
  let colorOneBackgroundElements = document.querySelectorAll('.colorOneBackground')
  colorOneBackgroundElements.forEach(colorOneBackgroundElement => {
    colorOneBackgroundElement.style.backgroundColor = color
  })
  let colorOneTextElements = document.querySelectorAll('.colorOneText')
  colorOneTextElements.forEach(colorOneTextElement => {
    colorOneTextElement.style.color = color
  })
  saveTabsButton[0].style.border = '2px solid ' + color
  chrome.storage.sync.set({['color']: color})
}

colorOneInput.addEventListener('change', (event) => {
  let reg=/^([0-9A-Fa-f]{3}){1,2}$/i;
  if (reg.test(colorOneInput.value)) {
    let color = '#' + colorOneInput.value
    setColors(color)
  }
  else {
    colorOneInput.value = colorTheme.slice(1)
  }
})

document.addEventListener('DOMContentLoaded', async function() {
  let groupLocalStorage = await chrome.storage.sync.get(null)
  let storedGroupKeys = Object.keys(groupLocalStorage)
  console.log(storedGroupKeys)
  for (storedGroupKey of storedGroupKeys) {
    if (storedGroupKey !== 'color') {
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
          savedTabsSetHTML += `<h3> Group ${groupNum} </h3>`
        }
        groupNum++
        for (tab of storedGroup) {
          savedTabsSetHTML += `
          <div>
            <p> <b> ${tab.title} </b> <br> ${tab.url} </p>
          </div>
          `
        }
      }
      savedTabsSetHTML += `</div>`
      $('.savedTabContainer').append(savedTabsSetHTML)
    }
  }

  let colorSetting = await chrome.storage.sync.get('color')
  colorOneInput.value = colorSetting.color.slice(1)
  setColors(colorSetting.color)
})

saveTabsButton[0].addEventListener('mouseover', async function() { 
  saveTabsButtonText.style.color = colorTheme
})

saveTabsButton[0].addEventListener('mouseout', async function() { 
  saveTabsButtonText.style.color = 'white'
})

colorOption.forEach(e => {
  e.addEventListener('click', async function() {
    let color = rgb2hex(getComputedStyle(e).backgroundColor)
    colorOneInput.value = color.slice(1)
    setColors(color)
  })
})

saveTabsButton[0].addEventListener('click', async function() {
  let numSavedTabsSets = 0
  let tabs = await chrome.tabs.query({ currentWindow: true })
  if (tabs.length > 1) {
    let groups = [[]]
    let prevTabGroup = 1
    let currentGroup = 0
    for (tab of tabs) {
      // TODO: Continue from here.
      let groupName = ""
      if (tab.groupId == -1) {
        if (tab.url != 'chrome://newtab/') {
          groups[0].push(tab)
        }
      }
      else {
        if (prevTabGroup == tab.groupId) {
          groups[currentGroup].push(tab)
        }
        else {
          prevTabGroup = tab.groupId
          currentGroup++
          groups.push([])
          groups[currentGroup].push(tab)
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
        savedTabsSetHTML += `<h3> Group ${groupNum} </h3>`
      }
      groupNum++
      for (tab of group) {
        savedTabsSetHTML += `
        <div>
          <p> <b> ${tab.title} </b> <br> ${tab.url} </p>
        </div>
        `
      }
    }
    savedTabsSetHTML += `</div>`
    $('.savedTabContainer').append(savedTabsSetHTML)
    numSavedTabsSets++
    let key = `${fullTimestamp}`
    chrome.storage.sync.set({[key]: [timestamp, groups]})

    chrome.tabs.query({currentWindow: true}, async function (tabs) {
      await chrome.tabs.create({ url: 'chrome://newtab' })
      for (var i = 0; i < tabs.length; i++) {
          chrome.tabs.remove(tabs[i].id)
      }
    })
  }
})

$(document).on('click', 'body > div.savedTabContainer > div', async function(e) {
  let groupKey = await e.currentTarget.className
  let storedValue = await chrome.storage.sync.get(groupKey)
  console.log(storedValue)
  let storedGroups = Object.values(storedValue)[0]
  console.log(storedGroups)
  let groupNum = 0
  for (storedGroup of storedGroups[1]) {
    if (groupNum == 0) {
      if (storedGroup.length !== 0) {
        for (tab of storedGroup) {
          await chrome.tabs.create({ url: tab.url })
        }
      }
    }
    else {
      let tabIds = []
      for (tab of storedGroup) {
        let newTab = await chrome.tabs.create({ url: tab.url })
        tabIds.push(newTab.id)
      }
      console.log(tabIds)
      await chrome.tabs.group({tabIds: tabIds})
    }
    groupNum++
  }
  e.currentTarget.remove()
  chrome.storage.sync.remove(groupKey)
  chrome.tabs.query({index: 0}, async function(firstTab) {
    await chrome.tabs.update(firstTab[0].id, {selected: true, highlighted: true, active: true})
  })
})

// TODO: Update to include tab group names and colors
// TODO: Add a close window checkbox option