class ScoreAnalytics {
    constructor(taskId, name) {
        this.taskId = taskId;
        this.name = name;
        this.output = document.querySelector('.output');
        this.chartContainer = document.querySelector('.chart-container');
    }
    async getList() {
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
        this.renderCharts(labels, passed, 'taskChart');
    }
    async myAnalytics() {
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
        parsedScoreList.data.content.forEach(elem=>{
            results.push(`Name:\t${elem.githubId}\n\nRank:\t${elem.rank}\n\nScore:\t${elem.totalScore}\n\n`);
            elem.taskResults.forEach(elem=>{
                let taskName = taskList[elem.courseTaskId];
                labels.push(taskName);
                passed.push(elem.score);
                results.push(`${elem.courseTaskId}\t${taskName}: <span class="score">${elem.score}</span>\n`);
            });
        });
        this.renderCharts(labels, passed, 'myChart');
        this.output.innerHTML += results.join('');
    }
    renderCharts(labels, passed, canvasId) {
            
        const data = {
            labels: labels,
            datasets: [{
                indexAxis: 'y',
                label: 'Passed',
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
                maintainAspectRatio: true
            }
        };
        let myChart = new Chart(
            document.getElementById(canvasId),
            config
        );
    }
    async getTaskList() {
        const taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
              task = await taskRequest.json();
        let taskList = {};
        if (task.message === "Unauthorized") {
            this.output.classList.add('output-fill');
            this.output.innerHTML = 'Зайди в app.rs.school';
            return false;
        }
        task.data.forEach(elem=>{
            taskList[elem.id] = elem.name;
        });
        for (let [key,taskName] of Object.entries(taskList)) {
            let option = document.createElement('option');
            option.value = key;
            option.innerHTML = `${key} ${taskName}`;
            document.querySelector('.id').append(option);
        }
    }
}

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
    new ScoreAnalytics(id, ghName).getList().then(()=> {
        new ScoreAnalytics(id, ghName).myAnalytics();
    }).catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
});
document.querySelector('.my-analytics').addEventListener('click', ()=>{
    const id = document.querySelector('.id').value,
          ghName = document.querySelector('.name').value,
          output =document.querySelector('.output'),
          chartContainer = document.querySelector('.chart-container');

    output.innerHTML = '';
    output.classList.add('output-fill');
    chartContainer.innerHTML = '<canvas id="myChart"></canvas>';
    new ScoreAnalytics(id, ghName).myAnalytics().catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
});
document.querySelector('.task-analitycs').addEventListener('click', ()=>{
    const id = document.querySelector('.id').value,
          ghName = document.querySelector('.name').value,
          output =document.querySelector('.output'),
          chartContainer = document.querySelector('.chart-container');

    output.innerHTML = 'LOADING...';
    output.classList.add('output-fill');
    chartContainer.innerHTML = '<canvas id="taskChart"></canvas>';
    new ScoreAnalytics(id, ghName).getList().catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
});



