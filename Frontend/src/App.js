import React, {Component} from 'react';
import './bootstrap-theme-minty.css';
import './App.css';
import {
    Button,
    Col,
    ListGroup,
    ListGroupItem,
    Modal,
    ModalBody,
    ModalHeader,
    Navbar,
    NavbarBrand,
    Row
} from 'reactstrap';
import axios from 'axios';
import {
    MdAdd,
    MdChevronLeft,
    MdChevronRight,
    MdClear,
    MdDoneAll,
    MdFastForward,
    MdFilterList,
    MdLocalCafe,
    MdLooks3,
    MdLooksOne,
    MdLooksTwo,
    MdNotInterested,
    MdPriorityHigh,
    MdSave,
    MdTimelapse,
    MdToday,
    MdViewWeek
} from "react-icons/md/index";
import Moment from 'react-moment';
import 'moment-timezone';
import moment from "moment";
import DayPicker from "react-day-picker";
import 'react-day-picker/lib/style.css';
import * as clone from "clone";
import {API_BASE_URL} from "./constants";

class App extends Component {

    TODO_EXPIRE_AT = {
        ALL: [0, "全部"],
        TODAY: [1, "今天", <MdToday/>],
        IN7DAYS: [2, "本周", <MdViewWeek/>],
        EXPIRED: [3, "已过期", <MdNotInterested/>],
        FUTURE: [4, "未来全部", <MdFastForward/>],
    };

    TODO_STATE = {
        ALL: [0, "", ""],
        UNCOMPLETED: [1, "待完成", <MdTimelapse/>],
        COMPLETED: [2, "已完成", <MdDoneAll/>],
    };

    TODO_PRIORITY = {
        ALL: [0, ""],
        URGENT: [3, "紧急"],
        IMPORTANT: [2, "重要"],
        NORMAL: [1, "普通"],
    };

    ORDERING_METHOD = {
        NEAR_EXPIRY_FIRST: ["expire_at", "截止日由早到晚"],
        NEAR_EXPIRY_LAST: ["-expire_at", "截止日由晚到早"],
        COMPLETED_FIRST: ["-completed", "已完成在前"],
        UNCOMPLETED_FIRST: ["completed", "待完成在前"],
        HIGH_PRIORITY_FIRST: ["-priority", "优先级从大到小"],
        LOW_PRIORITY_FIRST: ["priority", "优先级从小到大"],
    };

    RENDER_ORDERING_METHODS = [
        this.ORDERING_METHOD.HIGH_PRIORITY_FIRST,
        this.ORDERING_METHOD.LOW_PRIORITY_FIRST,
        this.ORDERING_METHOD.NEAR_EXPIRY_FIRST,
        this.ORDERING_METHOD.NEAR_EXPIRY_LAST,
        this.ORDERING_METHOD.COMPLETED_FIRST,
        this.ORDERING_METHOD.UNCOMPLETED_FIRST,
    ];

    constructor(props) {
        super(props);

        this.handleDayClick = this.handleDayClick.bind(this);
        this.toggle = this.toggle.bind(this);
        this.state = {
            isOpen: false,
            datePickerModalOpen: false,
            priorityPickerModalOpen: false,
            taskEditorModalOpen: false,
            taskEditorDatePickerModalOpen: false,
            taskEditorPriorityPickerModalOpen: false,
            todoInEdit: null,
            todos: [],
            prevHyperLink: null,
            nextHyperLink: null,
            orderingMethod: 0,
            filterState: this.TODO_STATE.UNCOMPLETED,
            filterExpireAt: this.TODO_EXPIRE_AT.FUTURE,
            taskSelectedPriority: this.TODO_PRIORITY.ALL,
            taskSelectedDay: null,
            taskInputValue: ""
        };
    }

    toggle() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }

    toggleDatePickerModal() {
        this.setState({
            datePickerModalOpen: !this.state.datePickerModalOpen
        });
    }

    togglePriorityPickerModal() {
        this.setState({
            priorityPickerModalOpen: !this.state.priorityPickerModalOpen
        });
    }

    toggleTaskEditorModal(todo) {
        this.setState({
            todoInEdit: clone(todo),
            taskEditorModalOpen: !this.state.taskEditorModalOpen
        });
    }

    toggleTaskEditorDatePickerModal() {
        this.setState({
            taskEditorDatePickerModalOpen: !this.state.taskEditorDatePickerModalOpen
        });
    }

    toggleTaskEditorPriorityPickerModal() {
        this.setState({
            taskEditorPriorityPickerModalOpen: !this.state.taskEditorPriorityPickerModalOpen
        });
    }

    updateTaskEditorInputValue(e) {
        if (this.state.todoInEdit === null || this.state.todoInEdit === undefined) return;
        let newTodoInEdit = clone(this.state.todoInEdit);
        newTodoInEdit['content'] = e.target.value;
        this.setState({
            todoInEdit: newTodoInEdit
        });
    }

    handleTaskEditorDaySelection(day) {
        let transformedTime = new Date(day).getTime() - 8 * 3600 * 1000;
        let newTodoInEdit = clone(this.state.todoInEdit);
        newTodoInEdit['expire_at'] = this.state.todoInEdit.expire_at === transformedTime ? -1 : transformedTime;
        this.setState({
            todoInEdit: newTodoInEdit
        });
    }

    updateTaskEditorPrioritySelection(e, selection) {
        e.preventDefault();
        let priority;
        if (this.state.todoInEdit.priority === selection[0]) {
            priority = this.TODO_PRIORITY.ALL[0];
        }
        else {
            priority = selection[0];
        }
        let newTodoInEdit = clone(this.state.todoInEdit);
        newTodoInEdit['priority'] = priority;
        this.setState({
            todoInEdit: newTodoInEdit
        });
    }

    updateStateFilter(e, selection) {
        e.preventDefault();
        if (this.state.filterState[0] === selection[0]) {
            selection = this.TODO_STATE.ALL;
        }
        this.setState({
            filterState: selection,
        }, () => this.updateTasksWithFilters());
    }

    updateExpireAtFilter(e, selection) {
        e.preventDefault();
        if (this.state.filterExpireAt[0] === selection[0]) {
            selection = this.TODO_EXPIRE_AT.ALL;
        }
        this.setState({
            filterExpireAt: selection,
        }, () => this.updateTasksWithFilters());
    }

    updateTaskPrioritySelection(e, selection) {
        e.preventDefault();
        if (this.state.taskSelectedPriority[0] === selection[0]) {
            selection = this.TODO_PRIORITY.ALL;
        }
        this.setState({
            taskSelectedPriority: selection,
        });
    }

    updateTaskInputValue(e) {
        this.setState({
            taskInputValue: e.target.value,
        });
    }

    handleNewTask(e) {
        e.preventDefault();
        if (this.state.taskInputValue.length === 0) return;
        let data = {
            content: this.state.taskInputValue
        };
        if (this.state.taskSelectedDay !== null && this.state.taskSelectedDay !== undefined) {
            data['expire_at'] = new Date(this.state.taskSelectedDay).getTime() - 8 * 3600 * 1000;
        }
        if (this.state.taskSelectedPriority !== null || this.state.taskSelectedPriority !== undefined) {
            data['priority'] = this.state.taskSelectedPriority[0];
        }
        axios.post(API_BASE_URL + '/todos/', data)
            .then(response => {
                this.setState({
                    taskInputValue: ""
                });
                this.setState({
                    taskSelectedDay: null,
                    taskSelectedPriority: this.TODO_PRIORITY.ALL,
                }, () => this.updateTasksWithFilters());
            })
            .catch(err => {
                console.log(err);
            })
            .then(() => {
            });
    }

    handleTaskDeletion(e, todo) {
        e.preventDefault();
        axios.delete(API_BASE_URL + '/todos/' + todo.id + '/')
            .then(response => {
                this.updateTasksWithFilters();
            })
            .catch(err => {
                console.log(err);
            })
            .then(() => {
            });
    }

    handleTaskStateChange(e, todo) {
        e.preventDefault();
        let data = {
            content: todo.content,
            completed: todo.completed ? 0 : 1
        };
        axios.put(API_BASE_URL + '/todos/' + todo.id + '/', data)
            .then(response => {
                this.setState({
                    taskSelectedDay: null,
                }, () => this.updateTasksWithFilters());
            })
            .catch(err => {
                console.log(err);
            })
            .then(() => {
            });
    }

    handleSaveInEditTodo(e) {
        e.preventDefault();
        if (this.state.todoInEdit === null || this.state.todoInEdit === undefined) return;
        let data = {
            content: this.state.todoInEdit.content,
            expire_at: this.state.todoInEdit.expire_at,
            priority: this.state.todoInEdit.priority,
        };
        axios.put(API_BASE_URL + '/todos/' + this.state.todoInEdit.id + '/', data)
            .then(response => {
                this.setState({
                    todoInEdit: null,
                    taskEditorModalOpen: false,
                    taskEditorDatePickerModalOpen: false,
                    taskEditorPriorityPickerModalOpen: false,
                }, () => this.updateTasksWithFilters());
            })
            .catch(err => {
                console.log(err);
            })
            .then(() => {
            });
    }

    handleOrderingMethodChange(e) {
        e.preventDefault();
        this.setState({
            orderingMethod: e.target.value,
        }, () => this.updateTasksWithFilters());
    }

    handleNextPage(e) {
        e.preventDefault();
        if (this.state.nextHyperLink === null || this.state.nextHyperLink === undefined) return;
        this.refillTodosFromServer(this.state.nextHyperLink);
    }

    handlePrevPage(e) {
        e.preventDefault();
        if (this.state.prevHyperLink === null || this.state.prevHyperLink === undefined) return;
        this.refillTodosFromServer(this.state.prevHyperLink);
    }

    renderPriorityBadge(priorityId) {
        if (priorityId === this.TODO_PRIORITY.URGENT[0]) {
            return (<span className="text-danger"><MdLooksOne
                className="icon-line-aligning-patch"/> {this.TODO_PRIORITY.URGENT[1]}</span>);
        }
        else if (priorityId === this.TODO_PRIORITY.IMPORTANT[0]) {
            return (<span className="text-info"><MdLooksTwo
                className="icon-line-aligning-patch"/> {this.TODO_PRIORITY.IMPORTANT[1]}</span>);
        }
        else if (priorityId === this.TODO_PRIORITY.NORMAL[0]) {
            return (<span className="text-success"><MdLooks3
                className="icon-line-aligning-patch"/> {this.TODO_PRIORITY.NORMAL[1]}</span>);
        } else {
            return ("");
        }
    }

    renderDrawerStateItem(item) {
        if (item[0] === 0) return;
        return (
            <ListGroupItem
                key={"drawerState" + item[0]}
                onClick={(e) => this.updateStateFilter(e, item)}
                className={"drawer-item" + (this.state.filterState[0] === item[0] ? " active" : "")}
                tag="button" action>
                <div className="icon-item">
                    {item[2]}
                </div>
                <span>{item[1]}</span>
            </ListGroupItem>
        )
    }

    renderDrawerExpireAtItem(item) {
        if (item[0] === 0) return;
        return (
            <ListGroupItem
                key={"drawerExpireAt" + item[0]}
                onClick={(e) => this.updateExpireAtFilter(e, item)}
                className={"drawer-item" + (this.state.filterExpireAt[0] === item[0] ? " active" : "")}
                tag="button" action>
                <div className="icon-item">
                    {item[2]}
                </div>
                <span>{item[1]}</span>
            </ListGroupItem>
        )
    }

    renderOrderingOptions() {
        return (
            <select
                className="form-control form-control-sm" id="exampleSelect1"
                style={{width: 'auto', display: 'inline'}}
                value={this.state.orderingMethod}
                onChange={(e) => this.handleOrderingMethodChange(e)}>
                {this.RENDER_ORDERING_METHODS.map((item, i) => (
                    <option key={"orderingOptions" + i} value={i}>{item[1]}</option>)
                )}
            </select>
        );
    }

    componentDidMount() {
        this.updateTasksWithFilters();
    }

    updateTasksWithFilters() {
        let parameters = [];
        parameters.push("ordering=" + this.RENDER_ORDERING_METHODS[this.state.orderingMethod][0] + ",-priority,expire_at,completed");
        if (this.state.filterState === this.TODO_STATE.COMPLETED) {
            parameters.push("f_state=completed");
        } else if (this.state.filterState === this.TODO_STATE.UNCOMPLETED) {
            parameters.push("f_state=uncompleted");
        }
        if (this.state.filterExpireAt === this.TODO_EXPIRE_AT.TODAY) {
            parameters.push("f_exp=today");
        } else if (this.state.filterExpireAt === this.TODO_EXPIRE_AT.IN7DAYS) {
            parameters.push("f_exp=in7days");
        } else if (this.state.filterExpireAt === this.TODO_EXPIRE_AT.EXPIRED) {
            parameters.push("f_exp=expired");
        } else if (this.state.filterExpireAt === this.TODO_EXPIRE_AT.FUTURE) {
            parameters.push("f_exp=future");
        }
        let date = new Date();
        date.setHours(0, 0, 0, 0);
        let tzero = date.getTime() - 8 * 3600 * 1000;
        parameters.push("t_zero=" + tzero);
        this.refillTodosFromServer(API_BASE_URL + '/todos/?' + parameters.join("&"));
    }

    refillTodosFromServer(url) {
        axios.get(url)
            .then(response => {
                this.setState({
                    prevHyperLink: response.data.previous,
                    nextHyperLink: response.data.next,
                    todos: response.data.results
                });
            })
            .catch(err => {
                console.log(err);
            })
            .then(() => {
            });
    }

    handleDayClick(day, {selected}) {
        this.setState({
            taskSelectedDay: selected ? undefined : day,
        });
    }

    renderDrawerItems() {
        return (
            <div>
                <h3 style={{marginBottom: '20px'}}>筛选器</h3>
                <ListGroup flush className="lp-list-group">
                    {this.renderDrawerStateItem(this.TODO_STATE.UNCOMPLETED)}
                    {this.renderDrawerStateItem(this.TODO_STATE.COMPLETED)}
                </ListGroup>
                <hr/>
                <ListGroup flush className="lp-list-group">
                    {this.renderDrawerExpireAtItem(this.TODO_EXPIRE_AT.IN7DAYS)}
                    {this.renderDrawerExpireAtItem(this.TODO_EXPIRE_AT.TODAY)}
                    {this.renderDrawerExpireAtItem(this.TODO_EXPIRE_AT.FUTURE)}
                    {this.renderDrawerExpireAtItem(this.TODO_EXPIRE_AT.EXPIRED)}
                </ListGroup>
                <hr/>
                <ListGroup flush className="lp-list-group">
                    <ListGroupItem className="drawer-item" tag="a"
                                   href="https://github.com/SumiMakito/Stacktodo"
                                   target="_blank" rel="noopener noreferrer" action>
                        <div className="icon-item"><MdLocalCafe/></div>
                        <span><small>Made with ❤&#xFE0E; by Makito</small></span>
                    </ListGroupItem>
                </ListGroup>
            </div>
        );
    }

    renderTodolist() {
        return (
            <ListGroup flush className="todo-list">
                {this.state.todos.map(todo => (
                    <ListGroupItem
                        key={"todo-item-" + todo.id}
                        className="todo-list-item">
                        <a className="todo-item-shortcut-container" onClick={(e) => {
                            this.handleTaskDeletion(e, todo)
                        }}>
                            <MdClear className="icon-line-aligning-patch"/>
                        </a>
                        <div className="custom-control custom-checkbox">
                            <input type="checkbox" className="custom-control-input"
                                   id={"todo-item-" + todo.id}
                                   checked={todo.completed === 1}
                                   onChange={(e) => {
                                       this.handleTaskStateChange(e, todo)
                                   }}/>
                            <label className="custom-control-label checkbox-patch"
                                   htmlFor={"todo-item-" + todo.id}>

                            </label>

                            <div className="todo-item-right-container float-right">
                                {
                                    <a className="clickable" onClick={() => {
                                        this.toggleTaskEditorModal(todo)
                                    }}>
                                        <small>{this.renderPriorityBadge(todo.priority)}</small>
                                    </a>
                                }
                                {" "}
                                <a className="clickable" onClick={() => {
                                    this.toggleTaskEditorModal(todo)
                                }}>
                                    {
                                        moment().year() !== moment(todo.expire_at).year() ? (
                                                todo.expire_at >= 0
                                                    ? (<small>
                                                            <Moment unix tz="Asia/Shanghai" format="YYYY 年 M 月 D 日">
                                                                {Math.round(todo.expire_at / 1000)}
                                                            </Moment></small>
                                                    ) : ""
                                            )
                                            : (
                                                todo.expire_at >= 0
                                                    ? (
                                                        <small>
                                                            <Moment unix tz="Asia/Shanghai"
                                                                    format="M 月 D 日"
                                                                    className={
                                                                        (moment().year() === moment(todo.expire_at).year()
                                                                            && moment().month() === moment(todo.expire_at).month()
                                                                            && moment().date() === moment(todo.expire_at).date())
                                                                            ? "todo-item-today" : ""
                                                                    }>
                                                                {Math.round(todo.expire_at / 1000)}
                                                            </Moment>
                                                        </small>
                                                    )
                                                    : ""
                                            )
                                    }
                                </a>
                                {" "}
                            </div>
                            <span
                                onClick={() => {
                                    this.toggleTaskEditorModal(todo)
                                }}
                                className={"clickable" +
                                (todo.completed === 1 ? " todo-item-completed" : "")
                                }
                            >{todo.content}</span>
                        </div>
                    </ListGroupItem>
                ))}
            </ListGroup>
        );
    }

    render() {
        return (
            <div className="App full-height">
                <Navbar color="dark" dark expand="md" fixed="top">
                    <div className="container">
                        <NavbarBrand href="/">Stacktodo<sup>*</sup></NavbarBrand>
                    </div>
                </Navbar>
                <div className="container full-height nav-patch">
                    <Row className="full-height">
                        <Col xs="4" className="App-drawer vertical-padding">
                            {this.renderDrawerItems()}
                        </Col>
                        <Col xs="8" className="App-todolist vertical-padding horizontal-padding">
                            <div>
                                <div style={{marginBottom: '10px'}}>
                                    <div className="float-right" style={{marginRight: '20px'}}>
                                        <span><MdFilterList/></span>{" "}
                                        {this.renderOrderingOptions()}
                                    </div>
                                    <h3 style={{display: "inline"}}>
                                        {
                                            (this.state.filterExpireAt[1] === "" ? "" : (this.state.filterExpireAt[1])) +
                                            (this.state.filterState[1] === "" ? "" : ("的" + this.state.filterState[1] + "项目"))
                                        }
                                    </h3>
                                </div>

                                <div className="input-group task-input" style={{paddingRight: '20px'}}>
                                    <div className="input-group-prepend">
                                        <a className="btn btn-sm input-group-text"
                                           onClick={() => this.toggleDatePickerModal()}>
                                            {
                                                (this.state.taskSelectedDay === undefined || this.state.taskSelectedDay === null) ?
                                                    <MdToday/>
                                                    : (
                                                        <small>
                                                            {moment(this.state.taskSelectedDay).format("YYYY/M/D")}
                                                        </small>
                                                    )
                                            }
                                        </a>
                                        <Modal size="sm" isOpen={this.state.datePickerModalOpen}
                                               toggle={() => this.toggleDatePickerModal()}
                                               className={this.props.className}>
                                            <ModalHeader toggle={() => this.toggleDatePickerModal()}>
                                                截止日期
                                            </ModalHeader>
                                            <ModalBody>
                                                <DayPicker
                                                    todayButton="回到当前月份"
                                                    selectedDays={this.state.taskSelectedDay}
                                                    onDayClick={this.handleDayClick}
                                                />
                                            </ModalBody>
                                        </Modal>
                                    </div>
                                    <div className="input-group-prepend">
                                        <a className="btn btn-sm input-group-text"
                                           onClick={() => this.togglePriorityPickerModal()}>
                                            {
                                                (this.state.taskSelectedPriority === null
                                                    || this.state.taskSelectedPriority === undefined
                                                    || this.state.taskSelectedPriority[0] === this.TODO_PRIORITY.ALL[0]) ?
                                                    <MdPriorityHigh/>
                                                    : (
                                                        this.renderPriorityBadge(this.state.taskSelectedPriority[0])
                                                    )
                                            }
                                        </a>
                                        <Modal size="sm" isOpen={this.state.priorityPickerModalOpen}
                                               toggle={() => this.togglePriorityPickerModal()}
                                               className={this.props.className}>
                                            <ModalHeader toggle={() => this.togglePriorityPickerModal()}>
                                                优先级
                                            </ModalHeader>
                                            <ModalBody>
                                                <ListGroup flush className="lp-list-group">
                                                    <ListGroupItem
                                                        onClick={(e) => this.updateTaskPrioritySelection(e, this.TODO_PRIORITY.URGENT)}
                                                        className={"text-danger drawer-item" + (this.state.taskSelectedPriority[0] === this.TODO_PRIORITY.URGENT[0] ? " active" : "")}
                                                        tag="a" href="" action>
                                                        <div className="text-danger icon-item">
                                                            <MdLooksOne/>
                                                        </div>
                                                        <span>{this.TODO_PRIORITY.URGENT[1]}</span>
                                                    </ListGroupItem>
                                                    <ListGroupItem
                                                        onClick={(e) => this.updateTaskPrioritySelection(e, this.TODO_PRIORITY.IMPORTANT)}
                                                        className={"text-info drawer-item" + (this.state.taskSelectedPriority[0] === this.TODO_PRIORITY.IMPORTANT[0] ? " active" : "")}
                                                        tag="a" href="" action>
                                                        <div className="text-info icon-item">
                                                            <MdLooksTwo/>
                                                        </div>
                                                        <span>{this.TODO_PRIORITY.IMPORTANT[1]}</span>
                                                    </ListGroupItem>
                                                    <ListGroupItem
                                                        onClick={(e) => this.updateTaskPrioritySelection(e, this.TODO_PRIORITY.NORMAL)}
                                                        className={"text-success drawer-item" + (this.state.taskSelectedPriority[0] === this.TODO_PRIORITY.NORMAL[0] ? " active" : "")}
                                                        tag="a" href="" action>
                                                        <div className="text-success icon-item">
                                                            <MdLooks3/>
                                                        </div>
                                                        <span>{this.TODO_PRIORITY.NORMAL[1]}</span>
                                                    </ListGroupItem>
                                                </ListGroup>
                                            </ModalBody>
                                        </Modal>
                                    </div>
                                    <textarea className="form-control autoExpand" rows="1" data-min-rows="1"
                                              placeholder="例如: 重现会导致 sudo rm -rf 的那个问题 #bug"
                                              value={this.state.taskInputValue}
                                              onChange={(e) => {
                                                  this.updateTaskInputValue(e)
                                              }}/>
                                    <div className="input-group-append">
                                        <a className={"btn btn-sm input-group-text" + (this.state.taskInputValue.length === 0 ? " disabled" : "")}
                                           onClick={(e) => {
                                               this.handleNewTask(e)
                                           }}>
                                            <MdAdd className="icon-line-aligning-patch-sm"/>
                                            <small>添加任务</small>
                                        </a>
                                    </div>
                                </div>

                                {this.renderTodolist()}

                                <Modal isOpen={this.state.taskEditorModalOpen}
                                       toggle={() => this.toggleTaskEditorModal()}
                                       className={this.props.className}>
                                    <ModalHeader toggle={() => this.toggleTaskEditorModal()}>
                                        编辑任务
                                    </ModalHeader>
                                    <ModalBody>
                                        <textarea
                                            style={{marginBottom: '10px'}}
                                            className="form-control" rows="5" data-min-rows="5"
                                            value={(this.state.todoInEdit !== null && this.state.todoInEdit !== undefined) ? this.state.todoInEdit.content : ""}
                                            onChange={(e) => {
                                                this.updateTaskEditorInputValue(e)
                                            }}/>
                                        <Button outline
                                                className="white btn-inline"
                                                size="sm"
                                                onClick={() => this.toggleTaskEditorDatePickerModal()}>
                                            <span><MdToday className="icon-line-aligning-patch"/>{" "}
                                                {
                                                    (this.state.todoInEdit === null || this.state.todoInEdit === undefined || this.state.todoInEdit.expire_at < 0) ? "截止日期"
                                                        : (moment(new Date(new Date(this.state.todoInEdit.expire_at).getTime() + 8 * 3600 * 1000)).format('YYYY/M/D'))
                                                }
                                            </span>
                                        </Button>
                                        {" "}
                                        <Button
                                            outline
                                            size="sm"
                                            className="white btn-inline"
                                            onClick={() => this.toggleTaskEditorPriorityPickerModal()}>
                                            {
                                                (this.state.todoInEdit === null || this.state.todoInEdit === undefined || this.state.todoInEdit.priority === this.TODO_PRIORITY.ALL[0]) ?
                                                    <span><MdPriorityHigh
                                                        className="icon-line-aligning-patch"/> 优先级</span>
                                                    : (
                                                        this.renderPriorityBadge((this.state.todoInEdit !== null && this.state.todoInEdit !== undefined) && this.state.todoInEdit.priority)
                                                    )
                                            }
                                        </Button>
                                        {" "}
                                        <Button
                                            outline
                                            size="sm"
                                            className="white btn-inline float-right"
                                            onClick={(e) => this.handleSaveInEditTodo(e)}>
                                            <MdSave className="icon-line-aligning-patch"/> 保存
                                        </Button>
                                        <Modal size="sm" isOpen={this.state.taskEditorDatePickerModalOpen}
                                               toggle={() => this.toggleTaskEditorDatePickerModal()}
                                               className={this.props.className}>
                                            <ModalHeader toggle={() => this.toggleTaskEditorDatePickerModal()}>
                                                截止日期
                                            </ModalHeader>
                                            <ModalBody>
                                                <DayPicker
                                                    todayButton="回到当前月份"
                                                    selectedDays={(this.state.todoInEdit !== null && this.state.todoInEdit !== undefined) && this.state.todoInEdit.expire_at > 0 ? new Date(new Date(this.state.todoInEdit.expire_at).getTime() + 8 * 3600 * 1000) : null}
                                                    onDayClick={(day) => this.handleTaskEditorDaySelection(day)}
                                                />
                                            </ModalBody>
                                        </Modal>
                                        <Modal size="sm" isOpen={this.state.taskEditorPriorityPickerModalOpen}
                                               toggle={() => this.toggleTaskEditorPriorityPickerModal()}
                                               className={this.props.className}>
                                            <ModalHeader toggle={() => this.toggleTaskEditorPriorityPickerModal()}>
                                                优先级
                                            </ModalHeader>
                                            <ModalBody>
                                                <ListGroup flush className="lp-list-group">
                                                    <ListGroupItem
                                                        onClick={(e) => this.updateTaskEditorPrioritySelection(e, this.TODO_PRIORITY.URGENT)}
                                                        className={"text-danger drawer-item" + ((this.state.todoInEdit !== null && this.state.todoInEdit !== undefined) && this.state.todoInEdit.priority === this.TODO_PRIORITY.URGENT[0] ? " active" : "")}
                                                        tag="a" href="" action>
                                                        <div className="text-danger icon-item">
                                                            <MdLooksOne/>
                                                        </div>
                                                        <span>{this.TODO_PRIORITY.URGENT[1]}</span>
                                                    </ListGroupItem>
                                                    <ListGroupItem
                                                        onClick={(e) => this.updateTaskEditorPrioritySelection(e, this.TODO_PRIORITY.IMPORTANT)}
                                                        className={"text-info drawer-item" + ((this.state.todoInEdit !== null && this.state.todoInEdit !== undefined) && this.state.todoInEdit.priority === this.TODO_PRIORITY.IMPORTANT[0] ? " active" : "")}
                                                        tag="a" href="" action>
                                                        <div className="text-info icon-item">
                                                            <MdLooksTwo/>
                                                        </div>
                                                        <span>{this.TODO_PRIORITY.IMPORTANT[1]}</span>
                                                    </ListGroupItem>
                                                    <ListGroupItem
                                                        onClick={(e) => this.updateTaskEditorPrioritySelection(e, this.TODO_PRIORITY.NORMAL)}
                                                        className={"text-success drawer-item" + ((this.state.todoInEdit !== null && this.state.todoInEdit !== undefined) && this.state.todoInEdit.priority === this.TODO_PRIORITY.NORMAL[0] ? " active" : "")}
                                                        tag="a" href="" action>
                                                        <div className="text-success icon-item">
                                                            <MdLooks3/>
                                                        </div>
                                                        <span>{this.TODO_PRIORITY.NORMAL[1]}</span>
                                                    </ListGroupItem>
                                                </ListGroup>
                                            </ModalBody>
                                        </Modal>

                                    </ModalBody>
                                </Modal>
                                <br/>
                                <div className="center">
                                    <a onClick={(e) => this.handlePrevPage(e)}
                                       className="btn btn-inline"
                                       style={{display: (this.state.prevHyperLink === null || this.state.prevHyperLink === undefined) ? "none" : "inline"}}><MdChevronLeft
                                        className="icon-line-aligning-patch"/> 上一页</a>
                                    <a onClick={(e) => this.handleNextPage(e)}
                                       className="btn btn-inline"
                                       style={{display: (this.state.nextHyperLink === null || this.state.nextHyperLink === undefined) ? "none" : "inline"}}>下一页 <MdChevronRight
                                        className="icon-line-aligning-patch"/></a>
                                    <span>
                                    {
                                        ((this.state.prevHyperLink === null || this.state.prevHyperLink === undefined)
                                            && (this.state.nextHyperLink === null || this.state.nextHyperLink === undefined)) ? (
                                            <small>已显示当前筛选条件下全部任务</small>) : ""
                                    }
                                    </span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        );
    }
}

export default App;
