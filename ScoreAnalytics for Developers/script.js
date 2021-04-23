class ScoreAnalytics {
    constructor(taskId, name) {
        this.taskId = taskId;
        this.name = name;
        this.output = document.querySelector('.output');
        this.chartContainer = document.querySelector('.chart-container');
        this.nameField = document.querySelector('.name');
        this.crossCheckId = document.querySelector('.cross-check');
        this.deadlineTask = {};
        this.timer = new Map();
    }
    async getList(more) {
        if (this.taskId == '0') {
            this.output.innerHTML = 'Choose task';
            throw 'Не выбран таск' ;
        }
        const scoreList = await fetch('https://app.rs.school/api/course/36/students/score?current=1&pageSize=4000&orderBy=rank&orderDirection=asc&activeOnly=true'),
            taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
            parsedScoreList = await scoreList.json(),
            task = await taskRequest.json(),
            labels = [],
            passed = [];
        let results = [],
            resultsList = [],
            taskName;
        task.data.forEach(elem=>{
            if (elem.id == this.taskId) {
                taskName = elem.name;
            }
        });
        parsedScoreList.data.content.forEach(elem=>{
            elem.taskResults.forEach(elem=>{
                if (elem.courseTaskId == this.taskId) {
                    if (results[elem.score] == undefined) {
                        results[elem.score] = 1;
                    } else {
                        results[elem.score] +=1;
                    }
                }
            });
        });
        results.forEach((elem,ind) => {
            if (elem !== undefined) {
                labels.push(`Score:${ind}`);
                passed.push(elem);
                resultsList.push(`\t\tScore: ${ind}   \tPassed: ${elem}`);
            }
        });
        this.output.innerHTML = `Task name: ${taskName} \n\nResults:\n${resultsList.join('\n')} \n\nPassed amount: ${results.reduce((a,b)=>a+b,0)}\n\n`;
        this.renderCharts(labels, passed, 'taskChart', false, more);
    }
    async myAnalytics(percentage, more) {
        if (this.name == '') {
            this.output.innerHTML = 'Ты кто? Напиши свой github ник выше!';
            return false;
        }
        const scoreListByName = await fetch(`https://app.rs.school/api/course/36/students/score?current=1&pageSize=100&orderBy=rank&orderDirection=asc&cityName=&mentor.githubId=&githubId=${this.name}&activeOnly=true`),
            taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
            parsedScoreList = await scoreListByName.json(),
            task = await taskRequest.json();
        let taskList = {},
            results = [],
            labels = [],
            passed = [];
        task.data.forEach(elem=>{
            taskList[elem.id] = elem.name;
        });
        if (percentage) {
            this.getTaskList(false, true).then(result=>{
                parsedScoreList.data.content.forEach(elem=>{
                    results.push(`Name:\t${elem.githubId}\n\nRank:\t${elem.rank}\n\nScore:\t${elem.totalScore}\n\n`);
                    elem.taskResults.forEach(elem=>{
                        let taskName = taskList[elem.courseTaskId];
                        labels.push(taskName);
                        passed.push((elem.score /result[elem.courseTaskId])*100);
                        results.push(`${elem.courseTaskId}\t${taskName}: ${elem.score}/${result[elem.courseTaskId]}\n`);
                    });
                }); 
                this.renderCharts(labels, passed, 'myChart', percentage, more);
                this.output.innerHTML += results.join('');
            });
            return 'ok';
        }
        parsedScoreList.data.content.forEach(elem=>{
            results.push(`Name:\t${elem.githubId}\n\nRank:\t${elem.rank}\n\nScore:\t${elem.totalScore}\n\n`);
            elem.taskResults.forEach(elem=>{
                let taskName = taskList[elem.courseTaskId];
                labels.push(taskName);
                passed.push(elem.score);
                results.push(`${elem.courseTaskId}\t${taskName}: ${elem.score}\n`);
            });
        });
        this.renderCharts(labels, passed, 'myChart', percentage, more);
        this.output.innerHTML += results.join('');
        }
    renderCharts(labels, passed, canvasId, percentage, more) {
            
        const data = {
            labels: labels,
            datasets: [{
                indexAxis: 'y',
                label: percentage ? '% of maximum score' : 'Passed',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: passed
        }]
        };
        const config = {
            type: 'bar',
            data,
            options: {
                responsive: true,
                maintainAspectRatio: more ? true : false
            }
        };
        let myChart = new Chart(
            document.getElementById(canvasId),
            config
        );
    }
    async getTaskList(deadline, percentage) {
        const taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
              task = await taskRequest.json();
        let   taskList = {},
              crossCheckList = {},
              deadlineList = {};
        if (task.message === "Unauthorized") {
            this.output.classList.add('output-fill');
            this.output.innerHTML = 'Зайди в app.rs.school';
            return false;
        }
        task.data.forEach(elem=>{
            taskList[elem.id] = elem.name;
            if (elem.checker === 'crossCheck') {
                crossCheckList[elem.id] = [elem.name,elem.maxScore];
            }
            if (deadline && new Date(elem.studentEndDate) > new Date() && new Date(elem.studentStartDate) < new Date()) {
                deadlineList[elem.name] = [`${new Date(elem.studentEndDate).toLocaleString()}\n${new Date(elem.studentEndDate).toString().match(/(GMT+[+]+[0-9 (a-zA-Zа-яА-Я,)]+)/)[0]}`,
                elem.descriptionUrl, elem.maxScore, `deadline submit`, elem.scoreWeight, new Date(elem.studentEndDate), elem.id];
            }
            if (percentage) {
                taskList[elem.id] = elem.maxScore;
            }
        });
        if (deadline) {
            return deadlineList;
        }
        if (percentage) {
            return taskList;
        }
        for (let [key,taskName] of Object.entries(taskList)) {
            let option = document.createElement('option');
            option.value = key;
            option.innerHTML = `${key} ${taskName}`;
            document.querySelector('.id').append(option);
        }
        for (let [key,[taskName, maxScore]] of Object.entries(crossCheckList)) {
            let option = document.createElement('option');
            option.value = key;
            option.dataset.maxScore = maxScore;
            option.innerHTML = `${key} ${taskName}`;
            document.querySelector('.cross-check').append(option);
        }
        chrome.cookies.get({ url: 'https://github.com', name: 'dotcom_user' }, (cookie) => {
            this.nameField.value = cookie.value;
        });
    }
    async getFeedback() {
        if (this.name == '') {
            this.output.innerHTML = 'Ты кто? Напиши свой github ник выше!';
            return false;
        }
        let feedbackRequest = await fetch(`https://app.rs.school/api/course/36/student/${this.name}/task/${this.crossCheckId.value}/cross-check/feedback`),
            feedbackResponse = await feedbackRequest.json();
        this.output.innerHTML = '';
        feedbackResponse.data.comments.forEach((elem, index)=>{
            const author = elem.author ? `<a href="https://github.com/${elem.author.githubId}" target="_blank">${elem.author.githubId}</a>` : `Student ${index+1}`;
            let feedback = `
            <div class="feedback">
                <div class="ghName">GitHub name: ${author}</div>
                <div class="fb-score">Score: ${elem.score}/${this.crossCheckId.selectedOptions[0].dataset.maxScore}</div>
                <div class="comment">Comment:\n${this.escapeHtml(elem.comment)}</div></div>
            `;
            this.output.innerHTML += feedback;
        });
        this.crossCheckId.selectedIndex = 0;
    }
    getDeadlineList() {
        return this.getTaskList(true).then(result => {
            this.output.innerHTML = '';
            for (let [taskName,[date, url, max, type,scoreWeight,deadlineDate,id]] of Object.entries(result)) {
                
                let task = `
                    <div class="task">
                        <div class="task-type">Type: <span class="type">${type}</span></div>
                        <div class="task-name">Name: <a href="${url}" target="_blank">${taskName}</a></div>
                        <div class="score-wrapper"><div class="score">Score: ${max}</div><div class="score-weight">Weight: ${scoreWeight}</div></div>
                        <div class="date">Date: ${date}\nTimer: <span class='id${id}'></span></div>
                    </div>
                    `;
                this.output.innerHTML +=task;
                this.timer[id] = deadlineDate;
            }
            return this;
        }).catch(reject => this.output.innerHTML = 'Дедлайнов нет');
    }
    escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
    deadlineTimer(date) {
        let a = date;
        let b = new Date();
        let c = (a-b)/1000,
            sec = Math.trunc(c%60),
            min = Math.trunc(c/60%60),
            hours = Math.trunc(c/60/60);
        return `${hours > 9 ? hours : '0'+hours}:${min > 9 ? min : '0'+min}:${sec > 9 ? sec : '0'+sec}`;

    }
}
async function start() {
    let request = await fetch('https://app.rs.school/api/session', {
        mode: 'no-cors'
    });
    if (request.ok) {
        new ScoreAnalytics().getTaskList();
        document.querySelector('.done').addEventListener('click', ()=>{
            const id = document.querySelector('.id').value,
                ghName = document.querySelector('.name').value,
                output =document.querySelector('.output'),
                chartContainer = document.querySelector('.chart-container');

            output.innerHTML = 'LOADING...';
            output.classList.add('output-fill');
            chartContainer.innerHTML = '<canvas id="taskChart"></canvas>';
            chartContainer.innerHTML += '<canvas id="myChart"></canvas>';
            new ScoreAnalytics(id, ghName).getList(true).then(()=> {
                new ScoreAnalytics(id, ghName).myAnalytics(false,true);
            }).catch((reject)=>{reject ? output.innerHTML = `${reject}` : output.innerHTML = 'Зайди в app.rs.school'});
        });
        document.querySelector('.my-analytics').addEventListener('click', ()=>{
            const id = document.querySelector('.id').value,
                ghName = document.querySelector('.name').value,
                output =document.querySelector('.output'),
                chartContainer = document.querySelector('.chart-container');

            output.innerHTML = '';
            output.classList.add('output-fill');
            chartContainer.innerHTML = '<canvas id="myChart"></canvas>';
            new ScoreAnalytics(id, ghName).myAnalytics(true).catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
        });
        document.querySelector('.task-analitycs').addEventListener('click', ()=>{
            const id = document.querySelector('.id').value,
                ghName = document.querySelector('.name').value,
                output =document.querySelector('.output'),
                chartContainer = document.querySelector('.chart-container');

            output.innerHTML = 'LOADING...';
            output.classList.add('output-fill');
            chartContainer.innerHTML = '<canvas id="taskChart"></canvas>';
            new ScoreAnalytics(id, ghName).getList().catch((reject)=>{reject ? 
                output.innerHTML = reject : 
                output.innerHTML = 'Зайди в app.rs.school'});
        });
        document.querySelector('.cross-check').addEventListener('change', ()=>{
            const id = document.querySelector('.id').value,
                ghName = document.querySelector('.name').value,
                output =document.querySelector('.output'),
                chartContainer = document.querySelector('.chart-container');

            output.innerHTML = 'LOADING...';
            output.classList.add('output-fill');
            chartContainer.innerHTML = '';
            new ScoreAnalytics(id, ghName).getFeedback().catch(()=>{output.innerHTML = 'Зайди в app.rs.school или укажи СВОЙ гитхаб, хитрый'});
        });
        document.querySelector('.deadline').addEventListener('click', () => {
            const id = document.querySelector('.id').value,
                ghName = document.querySelector('.name').value,
                output =document.querySelector('.output'),
                chartContainer = document.querySelector('.chart-container');

            output.innerHTML = 'LOADING...';
            output.classList.add('output-fill');
            chartContainer.innerHTML = '';
            new ScoreAnalytics(id, ghName).getDeadlineList().then((result)=>{
                for (let [elem,date] of Object.entries(result.timer)) {
                    let interval = setInterval(()=>{document.querySelector(`.id${elem}`) ? 
                    document.querySelector(`.id${elem}`).innerHTML = result.deadlineTimer(date) :
                    clearInterval(interval);}, 1000);
                }
            });
        });
    }else {
        window.alert('Нужно авторизоваться в app.rs.school, после чего снова открыть расширение', 'OK');
        let link = document.createElement('a');
        link.href = 'https://app.rs.school/';
        link.target = '_blank';
        link.click();
    }
}
start();



