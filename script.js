'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

/////////////////////////////////////////////////
// Data

const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-05-27T17:01:17.194Z',
    '2020-11-21T23:36:17.929Z',
    '2020-11-23T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // cs-CZ
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-11-23T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

/////////////////////////////////////////////////
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

/////////////////////////////////////////////////
// Functions

// *** Calculation and formatting of days between today and date of transfer ***
const formatMovementDate = function (date, locale) {
  // By default, difference between dates is in miliseconds, hence conversion is needed.
  const calcDaysPassed = (date1, date2) => Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
  const daysPassed = calcDaysPassed(date, new Date());

  // We need to return value form this function based on actual value of the daysPassed variable so that it can be used in displayMovements function.
  if (daysPassed === 0) {
    return `Today`;
  } else if (daysPassed === 1) {
    return `Yesterday`;
  } else if (daysPassed <= 7) {
    return `${daysPassed} days ago`
  } else {
    return new Intl.DateTimeFormat(locale).format(date);
  }
}

// *** Formating currency (reusable function due to its three general parameters) ***
const formatCurrency = function (value, locale, currency) {
  // We need to return value from this function so that it can be used in displayMovements function. By default, NumberFormat displays two decimals so toFixed method is not required.
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}

// *** Creating and displaying DOM elements ***
const displayMovements = function (acc, sort = false) {
  // Delete all HTML tags from the container
  containerMovements.innerHTML = '';

  // Sort/unsort movements array based on sort attribute set to true/false (= default value). When sort set to true, a shallow copy of acc.movements will be created by slice(). A shallow copy is necessary because sort method mutates original array.
  const movs = sort ? acc.movements.slice().sort((a, b) => a - b) : acc.movements;

  // Create HTML structure for every item of the movements/movementDates arrays.
  movs.forEach(function (mov, i) {
    // Looping also over movementsDates and creating a new date object. 
    const date = new Date(acc.movementsDates[i]);
    // Creating UI element based on this array and formatMovementDate (see above)
    const displayDate = formatMovementDate(date, acc.locale);

    // Set movement type based on its value
    const type = mov > 0 ? 'deposit' : 'withdrawal';

    const html =
      `<div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formatCurrency(mov, acc.locale, acc.currency)}</div>
      </div>`;

    containerMovements.insertAdjacentHTML("afterbegin", html);
  })
}

// *** Calculating and displaying the balance ***
const calcDisplayBalance = function (account) {
  // Creating balance as new object property
  account.balance = account.movements.reduce((acc, cur) => acc + cur, 0)
  labelBalance.textContent = formatCurrency(account.balance, account.locale, account.currency);
}

// *** Calculating and displaying the summary (at the bottom of the page) ***
const calcDisplaySummary = function (acc) {
  // Display incomes. Control structure is necessary because you cannot use reduce method on empty array.
  if (acc.movements.filter(mov => mov > 0).length > 0) {
    const incomes = acc.movements.filter(mov => mov > 0).reduce((acc, mov) => acc + mov);
    labelSumIn.textContent = formatCurrency(incomes, acc.locale, acc.currency);
  } else {
    labelSumIn.textContent = formatCurrency(0, acc.locale, acc.currency);
  }

  // Display outflows
  if (acc.movements.filter(mov => mov < 0).length > 0) {
    const outflows = Math.abs(acc.movements.filter(mov => mov < 0).reduce((acc, mov) => acc + mov));
    labelSumOut.textContent = formatCurrency(outflows, acc.locale, acc.currency);
  } else {
    labelSumOut.textContent = formatCurrency(0, acc.locale, acc.currency);
  }

  // Display interest. The logic is that the bank pays interest for each deposit if the interest is above 1 EUR
  const interest = acc.movements.filter(mov => mov > 0).map(deposit => deposit * acc.interestRate / 100 >= 1 ? deposit * acc.interestRate / 100 : 0).reduce((acc, int) => acc + int);
  labelSumInterest.textContent = formatCurrency(interest, acc.locale, acc.currency);
}

// *** Update of UI (aggregation of the previous 3 UI-related functions) ***
const updateUI = function (acc) {
  displayMovements(acc);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
}

// *** Display welcome message ***
const displayWelcome = function (acc) {
  labelWelcome.textContent = `Hello, ${acc.owner.split(' ')[0]}`;
}

// *** Display date under current ballance ***
const displayBalanceDate = function(acc) {
  const now = new Date();

  const options = {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    // month: 'long',
    month: 'numeric',
    year: 'numeric',
    // weekday: 'long'
  }

  labelDate.textContent = new Intl.DateTimeFormat(acc?.locale, options).format(now);
}

// *** Creating user names as new properties of objects in accounts array, e.g. Jesicca Davis => jd. This must happen before login. ***
const createUserNames = function (accs) {
  accs.forEach(account => account.userName = account.owner.toLowerCase().split(' ').map(name => name[0]).join(''));
}
createUserNames(accounts);

// Variables used in loginUser and other functions, hence they  need to be declared as global variables
let currentAccount, timerFn;

// *** User login: callback function of the login button event listener ***
const loginUser = function (ev) {
  // Prevents form from submitting/refreshing the page after clicking the form button
  ev.preventDefault();

  // Setting of current account based on which user logged in
  currentAccount = accounts.find(acc => acc.userName === inputLoginUsername.value);

  // Verifying user PIN
  if (currentAccount?.pin === +inputLoginPin.value) {
    // Update UI
    updateUI(currentAccount);

    // Display welcome message
    displayWelcome(currentAccount);

    // Display balance date
    displayBalanceDate(currentAccount);

    // Check for running timer. If a timer is running, then close it
    if (timerFn) clearInterval(timerFn);
    
    // Start new log out timer
    timerFn = startLogOutUser();

    // Disply app container
    containerApp.style.opacity = '1';

    // Clear input fields
    inputLoginUsername.value = inputLoginPin.value = '';

    // Get rid of focus on input fields (looks better)
    inputLoginUsername.blur();
    inputLoginPin.blur();
  } else {
    alert('Wrong username and/or PIN.');
  }
}

// *** Log out user after 5 minutes if the user is inactive ***
const startLogOutUser = function() {
  // Set timer to 5 minutes (300 secs)
  let timer = 300;

  // Function that takes care about the timer 
  const tick = function() {
    // In each call calculate and print the remaining time to UI
    let mins = `${Math.trunc(timer/60)}`.padStart(2, 0);
    let secs = `${timer % 60}`.padStart(2, 0);
        
    labelTimer.textContent = `${mins}:${secs}`;
        
    // When timer reaches 0, stop it and log out user
    if (timer === 0) {
      clearInterval(timerFn);
      containerApp.style.opacity = '0';
      labelWelcome.textContent = 'Log in to get started';            
    }

    // Decrease the timer by 1 sec in each call. This needs to be last line of code so that timer of 0:00 is also displayed.
    timer--;
  }
  
  // Call tick for the first time immediately
  tick();

  // And then call the tick every second
  const timerFn = setInterval(tick, 1000);

  // Return the timerFn so that after login we can check if there is another timer running
  return timerFn;
}

/////////////////////////////////////////////////
// Event handlers

// *** Login user (see loginUser function above) ***
btnLogin.addEventListener('click', loginUser);

// *** Transferring money to other account & updating the UI ***
btnTransfer.addEventListener('click', function (ev) {
  ev.preventDefault();

  // Define amount to transfer and the receiver based on his/her username
  const amount = +inputTransferAmount.value;
  const receiverAccount = accounts.find(acc => acc.userName === inputTransferTo.value);

  // Clear input fields
  inputTransferTo.value = inputTransferAmount.value = '';

  // Transfer will only happen when these conditions are fulfilled
  if (amount > 0 && currentAccount.balance >= amount && receiverAccount && receiverAccount.userName !== currentAccount.userName) {
    // Update movements
    currentAccount.movements.push(-amount);
    receiverAccount.movements.push(amount);

    // Update movements dates array in ISO string format that can be further processed by formatMovementDate function
    currentAccount.movementsDates.push(new Date().toISOString());
    receiverAccount.movementsDates.push(new Date().toISOString());

    // Update UI
    updateUI(currentAccount);

    // Reset timer
    clearInterval(timerFn);
    timerFn = startLogOutUser();
  } else {
    alert('Transfer not approved');

    // Reset timer
    clearInterval(timerFn);
    timerFn = startLogOutUser();
  }
})

// *** Requesting a loan. The rule: bank provides a loan only if there is a deposit of at least 10% of the loan (loan amount is floored to the closes integer) ***
btnLoan.addEventListener('click', function (ev) {
  ev.preventDefault();

  const loan = Math.floor(inputLoanAmount.value); // Does type coersion, hence  manual conversion by + is not necessary

  // Check if the request meets the rule
  if (loan > 0 && currentAccount.movements.some(mov => mov >= loan * 0.1)) {
    // It takes 1.5 sec for the bank to approve the loan
    setTimeout(() => {
    // Add loan to movements
    currentAccount.movements.push(loan);

    // Update movements dates
    currentAccount.movementsDates.push(new Date().toISOString());

    // Update UI
    updateUI(currentAccount);

    // Reset timer
    clearInterval(timerFn);
    timerFn = startLogOutUser();
    }, 1500);

  } else {
    alert('Loan not approved')

    // Reset timer
    clearInterval(timerFn);
    timerFn = startLogOutUser();
  }

  inputLoanAmount.value = '';
})

// *** Closing an account ***
btnClose.addEventListener('click', function (ev) {
  ev.preventDefault();

  if (inputCloseUsername.value === currentAccount.userName && +inputClosePin.value === currentAccount.pin) {
    // Find index of the curent user's account in the accounts array
    const index = accounts.findIndex(acc => acc.userName === currentAccount.userName);

    // Delete account in the accounts array at the position of index 
    accounts.splice(index, 1);

    // Hide UI
    containerApp.style.opacity = '0';
    labelWelcome.textContent = 'Log in to get started';
  } else {
    alert('Wrong username and/or PIN');
  }

  inputCloseUsername.value = inputClosePin.value = '';
})

// State varible for sorting used in the below callback function. By default the movements array is unsorted.
let sorted = false;

// *** Sorting the movements ***
btnSort.addEventListener('click', function () {
  // Displaying movements; sorted is set to true 
  displayMovements(currentAccount, !sorted);

  // Change of sorted to true so that then next click can be performed with false argument => the movements will be displayed based on their position in the movements array
  sorted = !sorted;
})

// *** FAKE LOGIN FOR TESTING PURPOSE ***
// currentAccount = account1;
// updateUI(currentAccount);
// containerApp.style.opacity = '1';
