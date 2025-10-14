const progress = document.getElementById('progress')
const prev = document.getElementById('prev')
const next = document.getElementById('next')
const circles = document.querySelectorAll('.circle')


let currentActive = 1

next.addEventListener('click', () => {
    currentActive++

    // console.log(currentActive);   WHEN WE CLICK ON BUTTON THEN ADD ONE NUMBER & SO-ON.... WE CAN SEE RESULT ON CONSOLE

    if(currentActive > circles.length) {
        currentActive = circles.length
    }
    //console.log(currentActive);   WHEN WE CLICK ON BUTTON THEN ADD ONE NUMBER (1-4) WE CAN SEE RESULT ON CONSOLE

    update()
})

prev.addEventListener('click', () => {
    currentActive--

    if(currentActive < 1) {
        currentActive = 1
    }

    update()
})


///MAKE A UPDATE FUNCTION
function update() {


    circles.forEach((circle, idx) => {
        if(idx < currentActive) {
            circle.classList.add('active')
        } else {
            circle.classList.remove('active')
        }
    })

///=====================

const actives = document.querySelectorAll('.active')

///console.log(actives.length / circles.length);    WHEN WE CLICK ON BUTTON THEN  WE CAN SEE length ON CONSOLE
// 2/4 = 0.5
// 3/4 = 0.75
// 4/4 = 1



// console.log((actives.length / circles.length) * 100)
// 2/4 * 100 = 50
// 3/4 * 100 = 75
// 4/4 * 100 = 100


// progress.style.width = (actives.length ) / (circles.length) * 100 + '%'
//   WE DON'T NEED TO START PROGRESS LINE ON 50%  


progress.style.width = (actives.length - 1 ) / (circles.length - 1) * 100 + '%'
///1/3 * 100 =33%
/// 2/3 * 100 = 66%
/// 3/3 * 100 = 100%



if(currentActive === 1) {
    prev.disabled = true
} else if(currentActive === circles.length) {
    next.disabled = true
} else {
    prev.disabled = false
    next.disabled = false
}


}