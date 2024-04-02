import express from 'express';
import Todo from '../schemas/todo.schemas.js';
import joi from 'joi';

const router = express.Router();
const createTodoschem = joi.object({
    value: joi.string().min(1).max(50).required(),
});

//할일 등록 API//
router.post('/todos', async (req, res, next) => {
    //     //클라이언트로 받아온 value 데이터를 받아온다.
    try {
        const validation = await createTodoschem.validateAsync(req.body);

        const { value } = validation;

        //만약 클라이언트가 value 데이터를 전달하지 않았을때, 클라이언트에게 에러 메세지를 전달한다.
        if (!value) {
            return res.status(400).json({
                errorMessage: '해야할 일 (value)를 전달받지 못했습니다.',
            });
        }

        //해당하는 마지막 order 데이터를 조회한다.
        //findOne 1개의 데이터를 조회한다.
        //sort 정렬한다. -> .(어떤 컬럼을?)
        const todoMaxOrder = await Todo.findOne().sort('-order').exec();

        //만약 order 데이터가 존재한다면 +1 로 하고 존재하지 않으면 1로 한다.
        const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

        //해야 할일 등록
        const todo = new Todo({ value, order });

        await todo.save();

        //해야 할일을 클라이언트에게 반환한다.
        return res.status(201).json({ todo: todo });
    } catch (error) {
        next(error);
    }
});
//해야할 일 목록 조회//
router.get('/todos', async (req, res, next) => {
    //1.해야할 일 목록 조회
    const todos = await Todo.find().sort('-order').exec();

    //2.해야할 일 목록 조회결과 클라이언트에게 반환
    return res.status(200).json({ todos });
});

//해야할 일 순서 변경API
router.patch('/todos/:todoId', async (req, res, next) => {
    const { todoId } = req.params; //todoId 조회, req에 있는 params안에서 조회
    const { order, done, value } = req.body; // 순서 변경을 위해 req에 있는 body안에서 order을 가지고 온다.

    const currentTodo = await Todo.findById(todoId).exec(); //현재 나의 order가 무엇인지 알기위해
    if (!currentTodo) {
        return res
            .status(404)
            .json({ errorMessage: '존재하지 않는 해야할 일 입니다.' });
    }

    //해야할 일 순서 변경
    if (order) {
        const targetTodo = await Todo.findOne({ order }).exec(); //order가 있는지 조회
        if (targetTodo) {
            targetTodo.order = currentTodo.order;
            await targetTodo.save();
        }
        currentTodo.order = order;
    }
    if (done !== undefined) {
        currentTodo.doneAt = done ? new Date() : null;
    }
    if (value) {
        currentTodo.value = value;
    }

    await currentTodo.save();

    return res.status(200).json({});
});

//할 일 삭제 API`
router.delete('/todos/:todoId', async (req, res, next) => {
    const { todoId } = req.params;

    const todo = await Todo.findById(todoId).exec();
    if (!todo) {
        return res
            .status(404)
            .json({ errorMessage: '존재하지 않는 해야 할 일 정보입니다.' });
    }

    await Todo.deleteOne({ _id: todoId });

    return res.status(200).json({});
});

export default router;
