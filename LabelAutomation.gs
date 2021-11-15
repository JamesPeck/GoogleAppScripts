const MAX_SCORE = 4;
const PROCESSED_LABEL = 'Processed';
let ONLY_UNREAD = false;
let TRACKING = true;
let receiptKeyWords = {"order": 3,"receipt": 5, "purchase": 5, "invoice": 4, "subscription": 2, "payment": 4, "bill": 1, "statement": 1, "confirmed": 1, "complete": 1, "confirmation":1, "thank you":2, "thanks": 2, "scheduled": 1};
let receiptBadWords = {"shipped": -5, "shipment": -5, "delivery": -5, "track": -3};
let trackingSheet = SpreadsheetApp.openById("{SHEET_ID_HERE}");

function main() {
  updateBySubject('receipts', receiptKeyWords, receiptBadWords);
}

function updateScore(score, subject, arrayToSearch) {
  for (keyWord in arrayToSearch) {
      if (subject.includes(keyWord)) {
        score += arrayToSearch[keyWord];
      }
    }
    return score;
}

function updateBySubject(label, keyWords, badWords) {
  let inbox;
  if (ONLY_UNREAD) {
    inbox = GmailApp.search('is:unread in:inbox');
  } else {
    inbox = GmailApp.getInboxThreads();
  }
  if (inbox) {
    inbox.forEach((email) => {
      let processedLabel = GmailApp.getUserLabelByName(PROCESSED_LABEL);
      if (!email.getLabels().includes(processedLabel)) {
        let score = 0;
        let subject = email.getFirstMessageSubject().toLowerCase();
        score = updateScore(score, subject, keyWords);
        score = updateScore(score, subject, badWords);
        Logger.log(subject + ":  " + score);
        let labelToApply = GmailApp.getUserLabelByName(label);
        processedLabel.addToThread(email);
        if (score >= MAX_SCORE) {
          labelToApply.addToThread(email);
          if (TRACKING) {
            trackEmail(email, score);
          }
        } else {
          labelToApply.removeFromThread(email);
        }
      }
    });
  }
}

function trackEmail(email, score) {
  let sheet1 = trackingSheet.getSheetByName('SubjectTracker');
  Logger.log('Adding... ' + email.getLastMessageDate() + ' ' + email.getFirstMessageSubject() + ' ' + score);
  sheet1.appendRow([email.getLastMessageDate(), email.getFirstMessageSubject(), score]);
  let sheet2 = trackingSheet.getSheetByName('WordTracker');
  let subject = email.getFirstMessageSubject().toLowerCase();
  let words = subject.split(" ");
  words.forEach(word => {
    sheet2.appendRow([word, score]);
  });
}
