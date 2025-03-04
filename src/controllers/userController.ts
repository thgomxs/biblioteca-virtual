import { userRepo, reviewRepo } from '../utils/database';
import { User } from '../entity/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: any, res: any) => {
  const user = await userRepo.findOne({ where: { username: req.body.username } });

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    const token = jwt.sign(
      { username: user.username, id: user.id },
      process.env.TOKEN_SECRET!,
    );

    res.cookie('authorization', token, { httpOnly: true });
    res.json({ message: 'Usuário logado!', auth: 'login', type: 'success' });
  } else {
    res.json({ message: 'Usuário ou senha incorretos!', auth: 'login', type: 'danger' });
  }
};

export const register = async (req: any, res: any) => {
  if (req.body.password !== req.body.confirmPassword) {
    res.json({ message: 'Senhas divergem.', auth: 'register', type: 'danger' });
  } else {
    try {
      let newUser = new User();
      newUser.username = req.body.username;
      newUser.password = bcrypt.hashSync(req.body.password);
      newUser.picture = './images/image-not-available.png';

      await userRepo.save(newUser);
      res.json({
        message: 'Registrado com sucesso!.',
        auth: 'register',
        type: 'success',
      });
    } catch (error) {
      res.json({ message: 'Usuário existente.', auth: 'register', type: 'danger' });
    }
  }
};

export const update = async (username: string, picture: string) => {
  const user = await userRepo.findOne({ where: { username: username } });

  if (user) {
    user.picture = picture;
    await userRepo.save(user);

    return user;
  } else {
    return false;
  }
};

export const renderReviews = async (req: any, res: any) => {
  const user = await userRepo.findOne({
    where: { username: req.user.username },
  });

  if (!user) {
    res.redirect('/');
  }

  if (user) {
    res.render('pages/reviews', {
      user: req.user ? req.user : false,
    });
  }
};

export const logout = async (req: any, res: any) => {
  res.clearCookie('authorization');
  res.redirect('/');
};
