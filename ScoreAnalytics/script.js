class ScoreAnalytics {
    constructor(taskId, name) {
        this.taskId = taskId;
        this.name = name;
        this.output = document.querySelector('.output');
    }
    async getList() {
        const scoreList = await fetch('https://app.rs.school/api/course/36/students/score?current=1&pageSize=4000&orderBy=rank&orderDirection=asc&activeOnly=true'),
            taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
            parsedScoreList = await scoreList.json(),
            task = await taskRequest.json();
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
                resultsList.push(`\t\tScore: ${ind}   \tPassed: ${elem}`);
            }
        });
        this.output.innerHTML = `Task name: ${taskName} \n\nResults:\n${resultsList.join('\n')} \n\nPassed amount: ${results.reduce((a,b)=>a+b,0)}\n\n`;
    }
   async myAnalytics() {
        const scoreListByName = await fetch(`https://app.rs.school/api/course/36/students/score?current=1&pageSize=100&orderBy=rank&orderDirection=asc&cityName=&mentor.githubId=&githubId=${this.name}&activeOnly=true`),
              taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
              parsedScoreList = await scoreListByName.json(),
              task = await taskRequest.json();
        let taskList = {},
            results = [];
        task.data.forEach(elem=>{
            taskList[elem.id] = elem.name;
        });
        parsedScoreList.data.content.forEach(elem=>{
            results.push(`Name:\t${elem.githubId}\n\nRank:\t${elem.rank}\n\nScore:\t${elem.totalScore}\n\n`);
            elem.taskResults.forEach(elem=>{
                let taskName = taskList[elem.courseTaskId];
                results.push(`${elem.courseTaskId}\t${taskName}: <span class="score">${elem.score}</span>\n`);
            });
        });
        this.output.innerHTML += results.join('');
   }
}
async function getTaskList(){
    const output =document.querySelector('.output'),
          taskRequest = await fetch('https://app.rs.school/api/course/36/tasks'),
          task = await taskRequest.json();
    let taskList = {};
    if (task.message === "Unauthorized") {
        output.classList.add('output-fill');
        output.innerHTML = 'Зайди в app.rs.school';
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
getTaskList();
document.querySelector('.done').addEventListener('click', ()=>{
    const id = document.querySelector('.id').value,
          ghName = document.querySelector('.name').value,
          output =document.querySelector('.output');
    output.innerHTML = 'LOADING...';
    output.classList.add('output-fill');
    new ScoreAnalytics(id, ghName).getList().then(()=> {
        new ScoreAnalytics(id, ghName).myAnalytics();
    }).catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
})
document.querySelector('.my-analytics').addEventListener('click', ()=>{
    const id = document.querySelector('.id').value,
          ghName = document.querySelector('.name').value,
          output =document.querySelector('.output');
    output.innerHTML = '';
    output.classList.add('output-fill');
    new ScoreAnalytics(id, ghName).myAnalytics().catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
})
document.querySelector('.task-analitycs').addEventListener('click', ()=>{
    const id = document.querySelector('.id').value,
          ghName = document.querySelector('.name').value,
          output =document.querySelector('.output');
    output.innerHTML = 'LOADING...';
    output.classList.add('output-fill');
    new ScoreAnalytics(id, ghName).getList().catch(()=>{output.innerHTML = 'Зайди в app.rs.school'});
})