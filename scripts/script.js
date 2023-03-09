
d3.queue()
    .defer(d3.json, "./data/ext_facts.json")
    .await(function (error, dataEmp) {
        if (error) {
            print('Oh dear, something went wrong with loading the data file ' + error);
        } else {


            /* -------------------------------- Data prep ------------------------------- */


            var table_data = d3.nest()
                // Group by employee_id 
                .key((d) => d.employee_id)
                // For groups return max(end_date), max(salary)
                .rollup(function (leaves) {
                    return {
                        end_date: d3.max(leaves, (d) => d.end_date),
                        salary: d3.max(leaves, (d) => d.salary),
                        //order: leaves.map(function(d){return d.order_id})
                        order: leaves.map((d) => d.order_id).filter(unique)
                    }
                })
                .entries(dataEmp)
                // Return 
                .map(function (d) {
                    return {
                        empl_id: +d.key,
                        name: generate_name(),
                        latest_work: new Date(d.value.end_date),
                        salary: +d.value.salary,
                        order: d.value.order

                    }
                })
                .sort((a, b) => d3.ascending(a.empl_id, b.empl_id))


                
                var data_working_hours = dataEmp.map(function(d){
                    let start_date = d.start_date.split(' ')[0] 
                    let generated_name = generate_name();
                    return {
                        empl_id: d.employee_id,
                        name: generate_name,
                        start_date: start_date,
                        start_year: start_date.split('-')[0],
                        start_month: start_date.split('-')[1],
                        start_day: start_date.split('-')[2],
                        duration_hours: +d.duration_seconds/60/60 
                        
                    }
                })
                
            d3.select(".employees_board")
            .append("div")
            .style("font-weight", "bold")
            .text("Employees:")

            
        /* ------------------------------ Employee dots ----------------------------- */

            var empl_box_width = parseInt( d3.select("#box-16").style("width") )
            var empl_box_height = parseInt( d3.select("#box-16").style("height") )

            var dot_size = 30;
            var dot_size_spaced = dot_size * 3.3;
            var dots_cols = Math.floor( empl_box_width / dot_size_spaced );
            var dots_rows = table_data.length / dots_cols;

            var employees_board = d3.select("#box-16")

            // Append dots

            function append_empl_badges(data){
                d3.selectAll(".empl_badge").remove()
                d3.selectAll(".empl_badge_name").remove()
                d3.selectAll(".activity_indicator").remove()
                
                employees_board
                .selectAll("dot")
                .data(data)
                .enter()
                    .append("div")
                    .attr("class", "empl_badge")
                    .attr("id", (d) => d.name + "-" + d.empl_id)
                    .attr("empl_id", (d) => d.empl_id)
                    .append("text")
                        .text((d) => "Empl. " + d.empl_id)

                d3.selectAll(".empl_badge")
                    .append("div")
                    .attr("class", function(d){

                        // ToDo date >> today - a month?
                        if (d.latest_work < new Date("2019-05-11") ){
                            return "activity_indicator"
                        }
                    })
                
                d3.selectAll(".activity_indicator")
                    .append("p")
                    .html("Not active")



            }

            append_empl_badges(table_data)

        } // End of data_emp?

            


                        
        
        /* -------------------------------------------------------------------------- */
        /*                               Control buttons                              */
        /* -------------------------------------------------------------------------- */



        /* --------------------------------- Sorting --------------------------------- */
        sort_direction = 'asc'

        d3.selectAll(".sort_button").on("click", function () {

            let sorted_data;
            
            if (sort_direction === 'asc'){
                sorted_data = table_data.sort((a,b) => d3.descending(a.empl_id, b.empl_id))
                append_empl_badges( sorted_data )
                sort_direction = 'desc'
                //d3.select(this).style("transform", "rotate(180deg)");
            }
            else if (sort_direction === 'desc'){
                sorted_data = table_data.sort((a,b) => d3.ascending(a.empl_id, b.empl_id))
                append_empl_badges( sorted_data )
                sort_direction = 'asc'
                //d3.select(this).style("transform", "rotate(360deg)");
            }

        })

        /* -------------------------------------------------------------------------- */
        /*                                  Calendar                                  */
        /* -------------------------------------------------------------------------- */

        // https://codesandbox.io/s/monthly-calendar-ur29q?file=/src/index.js

        dayjs.extend(window.dayjs_plugin_weekday)
        
        const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const TODAY = dayjs("2019-02-03").format("YYYY-MM-DD");
        const INITIAL_YEAR = dayjs("2019").format("YYYY");
        const INITIAL_MONTH = dayjs("02").format("M");

        let selectedMonth = dayjs(new Date(INITIAL_YEAR, INITIAL_MONTH - 1, 1));
        let currentMonthDays;
        let previousMonthDays;
        let nextMonthDays;      
        

        const dayOfWeekElement = d3.selectAll("#days-of-week").node();

        WEEKDAYS.forEach((weekday) => {
            const weekDayElement = document.createElement("li");
            dayOfWeekElement.appendChild(weekDayElement);
            weekDayElement.innerText = weekday;
        });

        /* -------------------------- Function Definiction -------------------------- */

        createCalendar();

        function createCalendar(year = INITIAL_YEAR, month = INITIAL_MONTH){
            const calendarDaysElement = d3.select("#calendar-days").node();

            // Name of current month
            d3.select("#selected-month").html(
                dayjs( new Date(year, month - 1) ).format("MMMM YYYY"));

            removeAllDayElements(calendarDaysElement); // d3.remove()?

            currentMonthDays = createDaysForCurrentMonth(
                year,
                month,
                dayjs(`${year}-${month}-01`).daysInMonth()
              );
            
            previousMonthDays = createDaysForPreviousMonth(year, month);
            nextMonthDays = createDaysForNextMonth(year, month);
            const days = [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];


            days.forEach((day) => {
                appendDay(day, calendarDaysElement);
              });
        };

        function appendDay(day, calendarDaysElement){
            const dayElement = document.createElement("li");
            const dayElementClassList = dayElement.classList;
            
            dayElementClassList.add("calendar-day");

            const dayOfMonthElement = document.createElement("span");

            dayOfMonthElement.innerText = day.dayOfMonth + ".";
            
            dayElement.appendChild(dayOfMonthElement);
            dayElement.setAttribute("date_id", day.date)

            calendarDaysElement.appendChild(dayElement);

            if (!day.isCurrentMonth) {
                dayElementClassList.add("calendar-day--not-current");
            }

            if (day.isCurrentMonth) {
                dayElementClassList.add("calendar-day--current");
            }
            
            if (day.date === TODAY) {
                dayElementClassList.add("calendar-day--today");
            }
        }

        function removeAllDayElements(calendarDaysElement) {
            let first = calendarDaysElement.firstElementChild;
          
            while (first) {
              first.remove();
              first = calendarDaysElement.firstElementChild;
            }
        }

        function getNumberOfDaysInMonth(year, month) {
            return dayjs(`${year}-${month}-01`).daysInMonth();
        }

        function createDaysForCurrentMonth(year, month) {
            return [...Array(getNumberOfDaysInMonth(year, month))].map((day, index) => {
              return {
                date: dayjs(`${year}-${month}-${index + 1}`).format("YYYY-MM-DD"),
                dayOfMonth: index + 1,
                isCurrentMonth: true
              };
            });
        }

        function createDaysForPreviousMonth(year, month) {
            const firstDayOfTheMonthWeekday = getWeekday(currentMonthDays[0].date);
          
            const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, "month");
          
            // Cover first day of the month being sunday (firstDayOfTheMonthWeekday === 0)
            const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday
              ? firstDayOfTheMonthWeekday - 1
              : 6;
          
            const previousMonthLastMondayDayOfMonth = dayjs(currentMonthDays[0].date)
              .subtract(visibleNumberOfDaysFromPreviousMonth, "day")
              .date();
          
            return [...Array(visibleNumberOfDaysFromPreviousMonth)].map((day, index) => {
              return {
                date: dayjs(
                  `${previousMonth.year()}-${previousMonth.month() + 1}-${
                    previousMonthLastMondayDayOfMonth + index
                  }`
                ).format("YYYY-MM-DD"),
                dayOfMonth: previousMonthLastMondayDayOfMonth + index,
                isCurrentMonth: false
              };
            });
          }
        
        function createDaysForNextMonth(year, month) {
            const lastDayOfTheMonthWeekday = getWeekday(
              `${year}-${month}-${currentMonthDays.length}`
            );
          
            const nextMonth = dayjs(`${year}-${month}-01`).add(1, "month");
          
            const visibleNumberOfDaysFromNextMonth = lastDayOfTheMonthWeekday
              ? 7 - lastDayOfTheMonthWeekday
              : lastDayOfTheMonthWeekday;
          
            return [...Array(visibleNumberOfDaysFromNextMonth)].map((day, index) => {
              return {
                date: dayjs(
                  `${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`
                ).format("YYYY-MM-DD"),
                dayOfMonth: index + 1,
                isCurrentMonth: false
              };
            });
        }
        
        function getWeekday(date) {
            return dayjs(date).weekday();
          }



        function filter_data_to_current_month_emp(data, empl_id){
            let selected_month = selectedMonth.$M + 1
            let selected_year = selectedMonth.$y

            let filtered_data_month_emp = data.filter(item =>
                item.empl_id == empl_id &&
                item.start_year == selected_year &&
                item.start_month == selected_month
                )
            return filtered_data_month_emp
        }
        
          
        function add_worked_hours_text(empl_id, filtered_data_month_emp){
            
            d3.selectAll(".calendar-day--current")
                .style("background-color", "white")
            
            d3.selectAll(".duration").remove()


            filtered_data_month_emp.forEach(function(d){
                let tile_id = d.start_date

                d3.selectAll(".calendar-day")
                    .filter(function(){
                        return d3.select(this).attr("date_id") === tile_id
                        })
                    .transition()
                    .duration(200)
                    /* .style("background-color", function(){
                        let duration_percetage = d.duration_hours/8
                        return "rgba(0,0,255," + duration_percetage + ")"
                        })  */

                d3.selectAll(".calendar-day")
                    .filter(function(){
                        return d3.select(this).attr("date_id") === tile_id
                        })
                    .append("div")
                        .attr("class", "duration")
                        .style("opacity", 0)
                            .html(() => d.duration_hours + "h")
                        .transition()
                        .style("opacity", 1)


            })
            
            if (filtered_data_month_emp.length > 31) {
                confirm(`Employee ${empl_id} has duplicite records!`)
            }
        }







        /* -------------------------------------------------------------------------- */
        /*                                 Interaction                                */
        /* -------------------------------------------------------------------------- */

        var selected_empl = null;


        /* ---------------------------- Employee circles ---------------------------- */


        $("#box-16").on("click", '.empl_badge', function(){

            if (d3.select(this).attr("empl_id") === selected_empl) {
                selected_empl = null;
                d3.selectAll(".empl_badge").style("background-color", "white");
                
                d3.selectAll(".calendar-day--current")
                    .style("background-color", "white")
                d3.selectAll(".duration").remove();

                emptyLineChart()
            }
            else {
                selected_empl = d3.select(this).attr("empl_id");

                let filtered_data_month_emp = filter_data_to_current_month_emp(data_working_hours, selected_empl)

                add_worked_hours_text( selected_empl, filtered_data_month_emp );
                d3.selectAll(".empl_badge").style("background-color", "white");
                d3.select(this).style("background-color", "rgb(150, 150, 150)");


                update_chart(filtered_data_month_emp);

            }
        })


        /* ---------------------------- Calendar controls --------------------------- */

        d3.select("#previous-month-selector").on("click", function (){
            selectedMonth = dayjs(selectedMonth).subtract(1, "month")

            let filtered_data_month_emp = filter_data_to_current_month_emp(data_working_hours, selected_empl)

            createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
            add_worked_hours_text( selected_empl, filtered_data_month_emp );
            update_chart(filtered_data_month_emp);



        })
        
        d3.select("#present-month-selector").on("click", function (){
            selectedMonth = dayjs(new Date(INITIAL_YEAR, INITIAL_MONTH - 1, 1));

            let filtered_data_month_emp = filter_data_to_current_month_emp(data_working_hours, selected_empl)

            createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
            add_worked_hours_text( selected_empl, filtered_data_month_emp );
            update_chart(filtered_data_month_emp);

        })
        
        d3.select("#next-month-selector").on("click", function (){
            selectedMonth = dayjs(selectedMonth).add(1, "month");

            let filtered_data_month_emp = filter_data_to_current_month_emp(data_working_hours, selected_empl)

            createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
            add_worked_hours_text( selected_empl, filtered_data_month_emp );
            update_chart(filtered_data_month_emp);

        })

        /* -------------------------------- Tooltips -------------------------------- */

        tippy('.filter_button', {
            //content: 'Sort by? ...',
            content:    "<div> \
                            <button id=\"sort_asceding\">Project</button>\
                             <button>...</button> \
                             <button>...</button> \
                             </div>"
                             ,
            interactive: true,
            allowHTML: true,
            trigger: 'mouseenter'
        });

        tippy('.sort_button', {
            //content: 'Sort by? ...',
            content: "<div> \
                            <button id=\"sort_asceding\">A-Z</button>\
                             <button>Z-A</button></div> \
                        <div>\
                            <button>0...1</button>\
                            <button>1...0</button> </div> ",//document.querySelector('#options-sort').innerHTML,
            interactive: true,
            allowHTML: true,
            trigger: 'mouseenter'
        });

        tippy('.group_button', {
            //content: 'Sort by? ...',
            content: "<div> \
            <button id=\"sort_asceding\">Salary</button>\
             <button>Project</button> \
             <button>Activity</button> \
             <button>...</button> \
             </div>"
            ,
interactive: true,
            allowHTML: true,
            trigger: 'mouseenter'
          });

          /* tippy('.empl_badge', {
            //content: 'Sort by? ...',
            content:"",
            interactive: true,
            allowHTML: true,
            trigger: 'mouseenter'
          }); */



        /* -------------------------------------------------------------------------- */
        /*                                 Line Chart        s                         */
        /* -------------------------------------------------------------------------- */

        var line_chart_2D_context;
        var renders_count = 0;

        function emptyLineChart(){
            let days_in_month = dayjs(selectedMonth).daysInMonth()
            let expected_line = new Array(days_in_month).fill(160/days_in_month)
            expected_line = cumsum(expected_line)
            let labels = new Array(days_in_month).fill(1).map((d,i) => +i+1);

            line_chart_2D_context.data.labels = labels
            line_chart_2D_context.data.datasets[0].data = new Array(
                line_chart_2D_context.data.datasets[0].data.length).fill(0)

            line_chart_2D_context.data.datasets[1].data = expected_line

            line_chart_2D_context.update()
        }


        function update_chart(filtered_data_month_emp){

            // When starts clicking before choosing initial emp
            if (filtered_data_month_emp < 1 && renders_count == 0){
                emptyLineChart()
            }

            var days_in_month = dayjs(selectedMonth).daysInMonth()

            // Generate empty array
            var worked_hours_by_day = new Array(
                days_in_month)
                .fill(0)
            
            var expected_hours_by_day = new Array(
                days_in_month)
                .fill(160/days_in_month)

                
            // Fill it by corresponding worked hours
            filtered_data_month_emp.forEach(function(d){
                let index = +d.start_day - 1 //beginning with 0
                worked_hours_by_day[index] = d.duration_hours
            })

            // Cumsum for chart
            let cumsum_worked_hours_by_day = cumsum(worked_hours_by_day)
            let cumsum_expected_hours_by_day = cumsum(expected_hours_by_day)
            cumsum_expected_hours_by_day

            // Labels by days in month
            let labels = new Array(days_in_month).fill(1).map((d,i) => +i+1)


            line_chart_2D_context.data.labels = labels
            line_chart_2D_context.data.datasets[0].data = cumsum_worked_hours_by_day
            line_chart_2D_context.data.datasets[1].data = cumsum_expected_hours_by_day
            line_chart_2D_context.update()

            renders_count += 1;
        }


        function init_chart(){
            
            let days_in_month = dayjs(selectedMonth).daysInMonth()

            // Arrays to initiate empty chart
            let labels = Array.apply(0, Array(days_in_month))
                            .fill(1)
                            .map(function(i,d) { return d+1;})

            let worked_hours =  Array.apply(0, Array(days_in_month))
                                .fill(0)

            let expected_hours = Array.apply(0, Array(days_in_month))
                                    .fill(1)
                                    .map(function(i,d) { return (d+1)*(160/days_in_month)})
                                    

            line_chart_2D_context = new Chart(
                d3.select("#line-chart").node(), 
                { type: 'line',
                    data: {
                  labels: labels,
                  datasets: [
                    {
                      label: "Worked",
                      backgroundColor: "rgb(0,0,255)",
                      data: worked_hours
                    },
                    {
                        label: "Expected",
                        data: expected_hours
                      }
                  ]
                },
                options: {
                 responsive: true,
                 maintainAspectRatio: false,
                  legend: { display: true },
                  title: {
                    display: true,
                    text: 'Worked hours total per employee id'
                  }
                }
            });
        }

        
        /* -------------------------------------------------------------------------- */
        /*                                Initial setup                               */
        /* -------------------------------------------------------------------------- */
        init_chart()




    })