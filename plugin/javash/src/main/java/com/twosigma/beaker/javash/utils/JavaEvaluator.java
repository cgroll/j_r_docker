/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.twosigma.beaker.javash.utils;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import com.twosigma.beaker.jvm.object.SimpleEvaluationObject;
import java.io.IOException;
import org.abstractmeta.toolbox.compilation.compiler.JavaSourceCompiler;
import org.abstractmeta.toolbox.compilation.compiler.impl.JavaSourceCompilerImpl;
import java.lang.reflect.*;
import java.nio.file.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Semaphore;
import java.util.regex.*;
import java.io.File;

import com.twosigma.beaker.jvm.classloader.DynamicClassLoader;
import com.twosigma.beaker.autocomplete.ClasspathScanner;
import com.twosigma.beaker.autocomplete.java.JavaAutocomplete;

public class JavaEvaluator {
  private final String shellId;
  private final String packageId;
  private List<String> classPath;
  private List<String> imports;
  private String outDir;
  private ClasspathScanner cps;
  private JavaAutocomplete jac;
  private boolean exit;
  private boolean updateLoader;
  private final ThreadGroup myThreadGroup;
  private final workerThread myWorker;
  
  private class jobDescriptor {
    String codeToBeExecuted;
    SimpleEvaluationObject outputObject;
    
    jobDescriptor(String c , SimpleEvaluationObject o) {
      codeToBeExecuted = c;
      outputObject = o;
    }
  }
  
  private final Semaphore syncObject = new Semaphore(0, true);
  private final ConcurrentLinkedQueue<jobDescriptor> jobQueue = new ConcurrentLinkedQueue<jobDescriptor>();

  public JavaEvaluator(String id) {
    shellId = id;
    packageId = "com.twosigma.beaker.javash.bkr"+shellId.split("-")[0];
    cps = new ClasspathScanner();
    jac = new JavaAutocomplete(cps);
    classPath = new ArrayList<String>();
    imports = new ArrayList<String>();
    exit = false;
    updateLoader = false;
    myThreadGroup = new ThreadGroup("tg"+shellId);
    myWorker = new workerThread(myThreadGroup);
    myWorker.start();
  }

  public String getShellId() { return shellId; }

  public void killAllThreads() {
    cancelExecution();
  }
  
  public void cancelExecution() {
    myThreadGroup.interrupt();
  }
  
  public void exit() {
    exit = true;
    cancelExecution();
  }

  public void setShellOptions(String cp, String in, String od) throws IOException {
    if(cp.isEmpty())
      classPath.clear();
    else
      classPath = Arrays.asList(cp.split("[\\s]+"));
    if (in.isEmpty())
      imports.clear();
    else
      imports = Arrays.asList(in.split("\\s+"));

    outDir = od;
    if(outDir!=null && !outDir.isEmpty()) {
	outDir = outDir.replace("$BEAKERDIR",System.getenv("beaker_tmp_dir"));
      try { (new File(outDir)).mkdirs(); } catch (Exception e) { }
    } else {
      outDir = Files.createTempDirectory(FileSystems.getDefault().getPath(System.getenv("beaker_tmp_dir")),"javash"+shellId).toString();
    }

    String cpp = "";
    for(String pt : classPath) {
      cpp += pt;
      cpp += File.pathSeparator;
    }
    cpp += File.pathSeparator;
    cpp += System.getProperty("java.class.path");
    cps = new ClasspathScanner(cpp);
    jac = new JavaAutocomplete(cps);

    // signal thread to create loader
    updateLoader = true;
    syncObject.release();
  }

  public void evaluate(SimpleEvaluationObject seo, String code) {
    // send job to thread
    jobQueue.add(new jobDescriptor(code,seo));
    syncObject.release();
  }

  public List<String> autocomplete(String code, int caretPosition) {
    return jac.doAutocomplete(code, caretPosition);
  }

  private class workerThread extends Thread {
  
    public workerThread(ThreadGroup tg) {
      super(tg, "worker");
    }
    
    /*
     * This thread performs all the evaluation
     */
    
    public void run() {
      DynamicClassLoader loader = null;;
      jobDescriptor j = null;
      JavaSourceCompiler javaSourceCompiler;
  
      javaSourceCompiler = new JavaSourceCompilerImpl();
      
      while(!exit) {
        try {
          // wait for work
          syncObject.acquire();
          
          // check if we must create or update class loader
          if(loader==null || updateLoader) {
            loader=new DynamicClassLoader(outDir);
            for(String pt : classPath) {
              loader.add(pt);
            }
          }
          
          // get next job descriptor
          j = jobQueue.poll();
          if(j==null)
            continue;
  
          j.outputObject.started();
          
          Pattern p;
          Matcher m;
          String pname = packageId;
          
          JavaSourceCompiler.CompilationUnit compilationUnit = javaSourceCompiler.createCompilationUnit(new File(outDir));
        
          // build the compiler class path
          String classpath = System.getProperty("java.class.path");
          String[] classpathEntries = classpath.split(File.pathSeparator);
          if(classpathEntries!=null && classpathEntries.length>0)
            compilationUnit.addClassPathEntries(Arrays.asList(classpathEntries));
          if(!classPath.isEmpty())
            compilationUnit.addClassPathEntries(classPath);
          compilationUnit.addClassPathEntry(outDir);
        
          // normalize and analyze code
          String code = normalizeCode(j.codeToBeExecuted);
        
          String [] codev = code.split("\n");
          int ci = 0;
        
          StringBuilder javaSourceCode =  new StringBuilder();
          p = Pattern.compile("\\s*package\\s+((?:[a-zA-Z]\\w*)(?:\\.[a-zA-Z]\\w*)*);.*");
          m = p.matcher(codev[ci]);
        
          if(m.matches()) {
            pname = m.group(1);
            ci++;
          }
          javaSourceCode.append("package ");
          javaSourceCode.append(pname);
          javaSourceCode.append(";\n");
        
          for(String i : imports) {
            javaSourceCode.append("import ");
            javaSourceCode.append(i);
            javaSourceCode.append(";\n");
          }
        
          p = Pattern.compile("\\s*import\\s+((?:[a-zA-Z]\\w*)(?:\\.[a-zA-Z]\\w*)*(?:\\.\\*)?);.*");
          m = p.matcher(codev[ci]);
          while(m.matches()) {
            String impstr = m.group(1);
            ci++;
            m = p.matcher(codev[ci]);
        
            javaSourceCode.append("import ");
            javaSourceCode.append(impstr);
            javaSourceCode.append(";\n");
          }
        
          p = Pattern.compile("(?:^|.*\\s+)class\\s+([a-zA-Z]\\w*).*");
          m = p.matcher(codev[ci]);
          if(m.matches()) {
            // this is a class definition
        
            String cname = m.group(1);
        
            for(; ci<codev.length; ci++)
              javaSourceCode.append(codev[ci]);    
        
            compilationUnit.addJavaSource(pname+"."+cname, javaSourceCode.toString());
            try {
              javaSourceCompiler.compile(compilationUnit);
              javaSourceCompiler.persistCompiledClasses(compilationUnit);
              j.outputObject.finished(null);
            } catch(Exception e) { j.outputObject.error("ERROR:\n"+e.toString()); }    
          } else {
            String ret = "void";
            if(codev[codev.length-1].matches("(^|.*\\s+)return\\s+.*"))
              ret = "Object";
            // this is an expression evaluation
            javaSourceCode.append("public class Foo {\n");
            javaSourceCode.append("public static ");
            javaSourceCode.append(ret);
            javaSourceCode.append(" beakerRun() throws InterruptedException {\n");
            for(; ci<codev.length; ci++)
              javaSourceCode.append(codev[ci]);
            javaSourceCode.append("}\n");
            javaSourceCode.append("}\n");
        
            compilationUnit.addJavaSource(pname+".Foo", javaSourceCode.toString());
  
            loader.clearCache();
            javaSourceCompiler.compile(compilationUnit);
            javaSourceCompiler.persistCompiledClasses(compilationUnit);
            Class<?> fooClass = loader.loadClass(pname+".Foo");
            Method mth = fooClass.getDeclaredMethod("beakerRun", (Class[]) null);
            Object o = mth.invoke(null, (Object[])null);
            if(ret.equals("Object")) {
              j.outputObject.finished(o);
            } else {
              j.outputObject.finished(null);
            }
          }
          j = null;
        } catch(Exception e) {
          if(j!=null && j.outputObject != null) {
            if (e instanceof InterruptedException || e instanceof InvocationTargetException) {
              j.outputObject.error("... cancelled!");
            } else {
              j.outputObject.error(e.getMessage());
            }          
          }
        }
      }
    }
    
    /*
     * This function does:
     * 1) remove comments
     * 2) ensure we have a cr after each ';' (if not inside double quotes or single quotes)
     * 3) remove empty lines
     */
  
    private String normalizeCode(String code)
    {
      String c1 = code.replaceAll("\r\n","\n").replaceAll("(?:/\\*(?:[^*]|(?:\\*+[^*/]))*\\*+/)|(?://.*)","");
      StringBuilder c2 = new StringBuilder();
      boolean indq = false;
      boolean insq = false;
      for(int i=0; i<c1.length(); i++)
      {
        char c = c1.charAt(i);
        switch(c) {
        case '"':
          if(!insq && i>0 && c1.charAt(i-1)!='\\')
            indq = !indq;
          break;
        case '\'':
          if(!indq && i>0 && c1.charAt(i-1)!='\\')
            insq = !insq;
          break;
        case ';':
          if(!indq && !insq) {
            c2.append(c);
            c = '\n';
          }
          break;
        }
        c2.append(c);
      }
      return c2.toString().replaceAll("\n\n+", "\n").trim();
    }
  }
}
